import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, VerificationPurpose } from '@prisma/client';

type HttpMethod = 'delete' | 'get' | 'post' | 'patch';

type ApiResponseBody<TData = unknown> = {
  code: number;
  message: string;
  data: TData;
};

type CapturedExample = {
  path: string;
  method: HttpMethod;
  request?: {
    name: string;
    summary: string;
    value: unknown;
  };
  responses: Array<{
    status: string;
    name: string;
    summary: string;
    value: unknown;
  }>;
};

type CapturedExamplesFile = {
  generatedAt: string;
  sourceBaseUrl: string;
  note: string;
  examples: CapturedExample[];
};

type RequestOptions = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  token?: string;
  expectedStatus?: number;
};

config({
  path: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
});

const DEFAULT_BASE_URL = `http://localhost:${process.env.PORT ?? 38080}`;
const DEFAULT_DEMO_EMAIL = 'yyy101@yy.com';
const DEFAULT_DEMO_PASSWORD = '123123123';
const OUTPUT_PATH = join('docs', 'swagger', 'openapi-examples.json');
const REDACTED_TOKEN = 'Bearer <captured-jwt-redacted>';
const REDACTED_PASSWORD = '<demo-password>';
const REDACTED_VERIFY_CODE = '<captured-code-redacted>';

async function main(): Promise<void> {
  const baseUrl = normalizeBaseUrl(
    process.env.API_BASE_URL ?? DEFAULT_BASE_URL,
  );
  const demoEmail = process.env.SWAGGER_DEMO_EMAIL ?? DEFAULT_DEMO_EMAIL;
  const demoPassword =
    process.env.SWAGGER_DEMO_PASSWORD ?? DEFAULT_DEMO_PASSWORD;
  const adminEmail = requireRuntimeValue(
    'SWAGGER_ADMIN_EMAIL',
    process.env.SWAGGER_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL,
  );
  const adminPassword = requireRuntimeValue(
    'SWAGGER_ADMIN_PASSWORD',
    process.env.SWAGGER_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD,
  );
  const generatedSuffix = Date.now().toString(36);
  const generatedUser = {
    username: `demo_${generatedSuffix.slice(-8)}`,
    password: demoPassword,
    email: `swagger.demo.${generatedSuffix}@example.com`,
  };
  const generatedFriendUser = {
    username: `friend_${generatedSuffix.slice(-7)}`,
    password: demoPassword,
    email: `swagger.friend.${generatedSuffix}@example.com`,
  };
  const rejectRequesterUser = {
    username: `rejecta_${generatedSuffix.slice(-6)}`,
    password: demoPassword,
    email: `swagger.reject.a.${generatedSuffix}@example.com`,
  };
  const rejectReceiverUser = {
    username: `rejectb_${generatedSuffix.slice(-6)}`,
    password: demoPassword,
    email: `swagger.reject.b.${generatedSuffix}@example.com`,
  };

  await assertSwaggerAvailable(baseUrl);

  const healthResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: '/api/v1/health',
    expectedStatus: 200,
  });
  const registerResponse = await request<
    ApiResponseBody<{ token: string; user: { id: string } }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/register',
    body: generatedUser,
    expectedStatus: 201,
  });
  const friendRegisterResponse = await request<
    ApiResponseBody<{ token: string; user: { id: string } }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/register',
    body: generatedFriendUser,
    expectedStatus: 201,
  });
  const loginResponse = await request<
    ApiResponseBody<{ token: string; user: unknown }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/login',
    body: {
      usernameOrEmail: demoEmail,
      password: demoPassword,
    },
    expectedStatus: 201,
  });
  const wrongPasswordResponse = await request<ApiResponseBody<null>>(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/login',
    body: {
      usernameOrEmail: demoEmail,
      password: 'wrong-password',
    },
    expectedStatus: 400,
  });
  const adminLoginResponse = await request<
    ApiResponseBody<{ token: string; user: unknown }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/login',
    body: {
      usernameOrEmail: adminEmail,
      password: adminPassword,
    },
    expectedStatus: 201,
  });

  const token = loginResponse.body.data.token;
  const adminToken = adminLoginResponse.body.data.token;
  const meResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: '/api/v1/users/me',
    token,
    expectedStatus: 200,
  });
  const updateMeBody = {
    nickname: '示例用户',
    bio: 'Swagger 真实示例捕获生成的测试资料。',
    uploadIntervalMinutes: 120,
  };
  const updateMeResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'patch',
    path: '/api/v1/users/me',
    body: updateMeBody,
    token,
    expectedStatus: 200,
  });
  const destroyRequestBody = {
    destroyReason: 'Swagger 示例捕获测试注销申请',
  };
  const destroyResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'post',
    path: '/api/v1/users/me/destroy-request',
    body: destroyRequestBody,
    token,
    expectedStatus: 201,
  });
  const cancelDestroyResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/users/me/destroy-request/cancel',
      token,
      expectedStatus: 201,
    },
  );
  const resetCodeResponse = await request<ApiResponseBody<string>>(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/password-reset/code',
    body: {
      email: generatedUser.email,
    },
    expectedStatus: 201,
  });
  const resetConfirmBody = {
    email: generatedUser.email,
    verifyCode: '2468',
    password: demoPassword,
  };
  await createPasswordResetCode(
    generatedUser.email,
    registerResponse.body.data.user.id,
    resetConfirmBody.verifyCode,
  );
  const resetConfirmResponse = await request<ApiResponseBody<string>>(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/password-reset/confirm',
    body: resetConfirmBody,
    expectedStatus: 201,
  });
  const generatedUserToken = registerResponse.body.data.token;
  const friendUserToken = friendRegisterResponse.body.data.token;
  const friendUserId = friendRegisterResponse.body.data.user.id;
  const rejectRequesterRegisterResponse = await request<
    ApiResponseBody<{ token: string; user: { id: string } }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/register',
    body: rejectRequesterUser,
    expectedStatus: 201,
  });
  const rejectReceiverRegisterResponse = await request<
    ApiResponseBody<{ token: string; user: { id: string } }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/auth/register',
    body: rejectReceiverUser,
    expectedStatus: 201,
  });
  const friendRequestBody = {
    toUserId: friendUserId,
  };
  const friendRequestResponse = await request<ApiResponseBody<{ id: string }>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/friends/requests',
      body: friendRequestBody,
      token: generatedUserToken,
      expectedStatus: 201,
    },
  );
  const friendRequestId = friendRequestResponse.body.data.id;
  const incomingRequestsResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/friends/requests/incoming',
      token: friendUserToken,
      expectedStatus: 200,
    },
  );
  const rejectFriendRequestSeedResponse = await request<
    ApiResponseBody<{ id: string }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/friends/requests',
    body: {
      toUserId: rejectReceiverRegisterResponse.body.data.user.id,
    },
    token: rejectRequesterRegisterResponse.body.data.token,
    expectedStatus: 201,
  });
  const rejectFriendRequestBody = {
    isPermanentRefusal: false,
  };
  const rejectFriendRequestResponse = await request<
    ApiResponseBody<{ id: string }>
  >(baseUrl, {
    method: 'post',
    path: `/api/v1/friends/requests/${rejectFriendRequestSeedResponse.body.data.id}/reject`,
    body: rejectFriendRequestBody,
    token: rejectReceiverRegisterResponse.body.data.token,
    expectedStatus: 201,
  });
  const acceptFriendResponse = await request<ApiResponseBody<{ id: string }>>(
    baseUrl,
    {
      method: 'post',
      path: `/api/v1/friends/requests/${friendRequestId}/accept`,
      token: friendUserToken,
      expectedStatus: 201,
    },
  );
  const friendRelationId = acceptFriendResponse.body.data.id;
  const myFriendsResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: '/api/v1/friends',
    token: generatedUserToken,
    expectedStatus: 200,
  });
  const updateFriendAliasBody = {
    friendAlias: '示例好友',
  };
  const updateFriendAliasResponse = await request<ApiResponseBody<string>>(
    baseUrl,
    {
      method: 'patch',
      path: `/api/v1/friends/${friendRelationId}/alias`,
      body: updateFriendAliasBody,
      token: friendUserToken,
      expectedStatus: 200,
    },
  );
  const updateFriendBlockBody = {
    isBlock: true,
  };
  const updateFriendBlockResponse = await request<ApiResponseBody<string>>(
    baseUrl,
    {
      method: 'patch',
      path: `/api/v1/friends/${friendRelationId}/block`,
      body: updateFriendBlockBody,
      token: friendUserToken,
      expectedStatus: 200,
    },
  );
  const bindBestFriendResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'post',
      path: `/api/v1/friends/${friendRelationId}/best`,
      token: friendUserToken,
      expectedStatus: 201,
    },
  );
  const friendPushUpdateBody = {
    pushDeviceType: 'ios',
    pushAliasType: 'push_normal',
    pushAlias: 'swagger-demo-device',
  };
  await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'patch',
    path: '/api/v1/users/me',
    body: friendPushUpdateBody,
    token: friendUserToken,
    expectedStatus: 200,
  });
  const deviceSnapshotBody = {
    deviceName: 'iPhone',
    batteryLevel: '76',
    locationSource: 'gps',
    locationAddress: '北京市朝阳区',
    locationLongitude: 116.4074,
    locationLatitude: 39.9042,
  };
  const createDeviceSnapshotResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/devices/snapshots',
      body: deviceSnapshotBody,
      token: friendUserToken,
      expectedStatus: 201,
    },
  );
  const myLatestDeviceSnapshotResponse = await request<
    ApiResponseBody<unknown>
  >(baseUrl, {
    method: 'get',
    path: '/api/v1/devices/me/snapshots/latest',
    token: friendUserToken,
    expectedStatus: 200,
  });
  const myDeviceSnapshotsResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/devices/me/snapshots',
      token: friendUserToken,
      expectedStatus: 200,
    },
  );
  const friendDeviceSnapshotsResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: `/api/v1/devices/users/${friendUserId}/snapshots`,
      token: generatedUserToken,
      expectedStatus: 200,
    },
  );
  const friendLatestDeviceSnapshotResponse = await request<
    ApiResponseBody<unknown>
  >(baseUrl, {
    method: 'get',
    path: `/api/v1/devices/users/${friendUserId}/snapshots/latest`,
    token: generatedUserToken,
    expectedStatus: 200,
  });
  const requestLocationResponse = await request<ApiResponseBody<string>>(
    baseUrl,
    {
      method: 'post',
      path: `/api/v1/devices/users/${friendUserId}/location-request`,
      token: generatedUserToken,
      expectedStatus: 201,
    },
  );
  const vipPlansResponse = await request<
    ApiResponseBody<Array<{ id: string; status: string; price: string }>>
  >(baseUrl, {
    method: 'get',
    path: '/api/v1/vip/plans',
    token: generatedUserToken,
    expectedStatus: 200,
  });
  const duetVipPlan =
    vipPlansResponse.body.data.find((plan) => plan.status === 'DUET') ??
    vipPlansResponse.body.data[0];
  if (!duetVipPlan) {
    throw new Error('无法捕获 VIP 示例：当前数据库没有 VIP 套餐。');
  }
  const createVipPlanBody = {
    name: 'Swagger 示例单人月卡',
    description: '由真实接口示例捕获脚本创建。',
    level: 1,
    durationMonths: 1,
    price: 9.9,
    productCode: `swagger.demo.vip.${generatedSuffix}`,
    status: 'ACTIVE',
  };
  const createVipPlanResponse = await request<ApiResponseBody<{ id: string }>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/vip/plans',
      body: createVipPlanBody,
      token: adminToken,
      expectedStatus: 201,
    },
  );
  const updateVipPlanBody = {
    description: '由真实接口示例捕获脚本创建并更新。',
    price: 10.9,
  };
  const updateVipPlanResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'patch',
      path: `/api/v1/vip/plans/${createVipPlanResponse.body.data.id}`,
      body: updateVipPlanBody,
      token: adminToken,
      expectedStatus: 200,
    },
  );
  const createVipOrderBody = {
    planId: duetVipPlan.id,
    amount: Number(duetVipPlan.price),
    source: 'IOS',
  };
  const createVipOrderResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/vip/orders',
      body: createVipOrderBody,
      token: generatedUserToken,
      expectedStatus: 201,
    },
  );
  const myVipOrdersResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: '/api/v1/vip/orders/me',
    token: generatedUserToken,
    expectedStatus: 200,
  });
  const listVipOrdersResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/vip/orders',
      token: adminToken,
      expectedStatus: 200,
    },
  );
  const bindVipBody = {
    toUserId: friendUserId,
  };
  const bindVipResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'post',
    path: '/api/v1/vip/bindings',
    body: bindVipBody,
    token: generatedUserToken,
    expectedStatus: 201,
  });
  const updateAppConfigBody = {
    appName: '伴你左右',
    unCheckMode: true,
  };
  const updateAppConfigResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'patch',
      path: '/api/v1/app-config/app',
      body: updateAppConfigBody,
      token: adminToken,
      expectedStatus: 200,
    },
  );
  const appConfigResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: '/api/v1/app-config/app',
    expectedStatus: 200,
  });
  const createAnnouncementBody = {
    title: '系统维护通知',
    authorName: '管理员',
    content: '今晚 23:00 进行系统维护。',
  };
  const createAnnouncementResponse = await request<
    ApiResponseBody<{ id: string }>
  >(baseUrl, {
    method: 'post',
    path: '/api/v1/announcements',
    body: createAnnouncementBody,
    token: adminToken,
    expectedStatus: 201,
  });
  const listAnnouncementsResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/announcements',
      expectedStatus: 200,
    },
  );
  const latestAnnouncementResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/announcements/latest',
      expectedStatus: 200,
    },
  );
  const createFeedbackBody = {
    content: '希望增加夜间模式。',
  };
  const createFeedbackResponse = await request<ApiResponseBody<string>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/feedback',
      body: createFeedbackBody,
      token: generatedUserToken,
      expectedStatus: 201,
    },
  );
  const listFeedbackResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/feedback',
      token: adminToken,
      expectedStatus: 200,
    },
  );
  const createVersionBody = {
    title: '1.2.0 发布',
    description: '优化设备状态同步。',
    androidVersionName: '1.2.0',
    iosVersionName: '1.2.0',
    androidDownloadUrl: 'https://example.com/android.apk',
    iosDownloadUrl: 'https://apps.apple.com/app/id0000000000',
    forceUpdate: false,
  };
  const createVersionResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/versions',
      body: createVersionBody,
      token: adminToken,
      expectedStatus: 201,
    },
  );
  const latestVersionResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'get',
      path: '/api/v1/versions/latest',
      expectedStatus: 200,
    },
  );
  const createMemoirBody = {
    friendRelationId,
    title: '第一次一起看海',
    content: '那天风很大，但我们都笑得很开心。',
    happenedAt: '2026-05-18T12:00:00.000Z',
  };
  const createMemoirResponse = await request<ApiResponseBody<{ id: string }>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/memoirs',
      body: createMemoirBody,
      token: friendUserToken,
      expectedStatus: 201,
    },
  );
  const memoirId = createMemoirResponse.body.data.id;
  const getMemoirResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: `/api/v1/memoirs/${memoirId}`,
    token: generatedUserToken,
    expectedStatus: 200,
  });
  const listMemoirsResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: `/api/v1/memoirs?friendRelationId=${friendRelationId}`,
    token: friendUserToken,
    expectedStatus: 200,
  });
  const updateMemoirBody = {
    title: '一起看海的那天',
  };
  const updateMemoirResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'patch',
      path: `/api/v1/memoirs/${memoirId}`,
      body: updateMemoirBody,
      token: friendUserToken,
      expectedStatus: 200,
    },
  );
  const createMomentBody = {
    friendRelationId,
    content: '今天的晚霞很好看。',
    happenedAt: '2026-05-18T13:00:00.000Z',
  };
  const createMomentResponse = await request<ApiResponseBody<{ id: string }>>(
    baseUrl,
    {
      method: 'post',
      path: '/api/v1/moments',
      body: createMomentBody,
      token: friendUserToken,
      expectedStatus: 201,
    },
  );
  const momentId = createMomentResponse.body.data.id;
  const getMomentResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: `/api/v1/moments/${momentId}`,
    token: generatedUserToken,
    expectedStatus: 200,
  });
  const listMomentsResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
    method: 'get',
    path: `/api/v1/moments?friendRelationId=${friendRelationId}`,
    token: friendUserToken,
    expectedStatus: 200,
  });
  const updateMomentBody = {
    content: '今天的晚霞很好看，想第一时间分享给你。',
  };
  const updateMomentResponse = await request<ApiResponseBody<unknown>>(
    baseUrl,
    {
      method: 'patch',
      path: `/api/v1/moments/${momentId}`,
      body: updateMomentBody,
      token: friendUserToken,
      expectedStatus: 200,
    },
  );
  const deleteMomentResponse = await request<ApiResponseBody<string>>(baseUrl, {
    method: 'delete',
    path: `/api/v1/moments/${momentId}`,
    token: friendUserToken,
    expectedStatus: 200,
  });
  const deleteMemoirResponse = await request<ApiResponseBody<string>>(baseUrl, {
    method: 'delete',
    path: `/api/v1/memoirs/${memoirId}`,
    token: friendUserToken,
    expectedStatus: 200,
  });
  const deleteFriendResponse = await request<ApiResponseBody<string>>(baseUrl, {
    method: 'delete',
    path: `/api/v1/friends/${friendRelationId}`,
    token: friendUserToken,
    expectedStatus: 200,
  });

  const examplesFile: CapturedExamplesFile = {
    generatedAt: new Date().toISOString(),
    sourceBaseUrl: baseUrl,
    note: '本文件由 npm run api:examples 通过真实 HTTP 请求生成。token 和密码已脱敏，验证码不会写入文档。',
    examples: [
      {
        path: '/api/v1/health',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'healthSuccess',
            summary: '健康检查成功响应',
            value: redactSensitive(healthResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/auth/register',
        method: 'post',
        request: {
          name: 'registerSuccessRequest',
          summary: '注册成功请求',
          value: redactSensitive({
            ...generatedUser,
            password: REDACTED_PASSWORD,
          }),
        },
        responses: [
          {
            status: '201',
            name: 'registerSuccess',
            summary: '注册成功响应',
            value: redactSensitive(registerResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/auth/login',
        method: 'post',
        request: {
          name: 'loginSuccessRequest',
          summary: '登录成功请求',
          value: {
            usernameOrEmail: demoEmail,
            password: REDACTED_PASSWORD,
          },
        },
        responses: [
          {
            status: '201',
            name: 'loginSuccess',
            summary: '登录成功响应',
            value: redactSensitive(loginResponse.body),
          },
          {
            status: '400',
            name: 'loginWrongPassword',
            summary: '密码错误响应',
            value: redactSensitive(wrongPasswordResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/users/me',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'getMeSuccess',
            summary: '获取当前用户成功响应',
            value: redactSensitive(meResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/users/me',
        method: 'patch',
        request: {
          name: 'updateMeSuccessRequest',
          summary: '更新当前用户资料请求',
          value: updateMeBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateMeSuccess',
            summary: '更新当前用户资料成功响应',
            value: redactSensitive(updateMeResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/users/me/destroy-request',
        method: 'post',
        request: {
          name: 'destroyRequestSuccessRequest',
          summary: '申请注销请求',
          value: destroyRequestBody,
        },
        responses: [
          {
            status: '201',
            name: 'destroyRequestSuccess',
            summary: '申请注销成功响应',
            value: redactSensitive(destroyResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/users/me/destroy-request/cancel',
        method: 'post',
        responses: [
          {
            status: '201',
            name: 'cancelDestroySuccess',
            summary: '取消注销成功响应',
            value: redactSensitive(cancelDestroyResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/auth/password-reset/code',
        method: 'post',
        request: {
          name: 'passwordResetCodeRequest',
          summary: '发送密码重置验证码请求',
          value: {
            email: generatedUser.email,
          },
        },
        responses: [
          {
            status: '201',
            name: 'passwordResetCodeSuccess',
            summary: '验证码发送成功响应',
            value: redactSensitive(resetCodeResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/auth/password-reset/confirm',
        method: 'post',
        request: {
          name: 'passwordResetConfirmRequest',
          summary: '确认密码重置请求',
          value: {
            email: resetConfirmBody.email,
            verifyCode: REDACTED_VERIFY_CODE,
            password: REDACTED_PASSWORD,
          },
        },
        responses: [
          {
            status: '201',
            name: 'passwordResetConfirmSuccess',
            summary: '密码重置成功响应',
            value: redactSensitive(resetConfirmResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/requests',
        method: 'post',
        request: {
          name: 'friendRequestCreateRequest',
          summary: '请求添加好友请求',
          value: friendRequestBody,
        },
        responses: [
          {
            status: '201',
            name: 'friendRequestCreateSuccess',
            summary: '请求添加好友成功响应',
            value: redactSensitive(friendRequestResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/requests/incoming',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'incomingFriendRequestsSuccess',
            summary: '查询请求我的好友成功响应',
            value: redactSensitive(incomingRequestsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/requests/{id}/reject',
        method: 'post',
        request: {
          name: 'rejectFriendRequestRequest',
          summary: '拒绝好友请求',
          value: rejectFriendRequestBody,
        },
        responses: [
          {
            status: '201',
            name: 'rejectFriendRequestSuccess',
            summary: '拒绝好友请求成功响应',
            value: redactSensitive(rejectFriendRequestResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/requests/{id}/accept',
        method: 'post',
        responses: [
          {
            status: '201',
            name: 'acceptFriendRequestSuccess',
            summary: '同意好友请求成功响应',
            value: redactSensitive(acceptFriendResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'myFriendsSuccess',
            summary: '查询我的好友成功响应',
            value: redactSensitive(myFriendsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/{id}/alias',
        method: 'patch',
        request: {
          name: 'updateFriendAliasRequest',
          summary: '修改好友备注请求',
          value: updateFriendAliasBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateFriendAliasSuccess',
            summary: '修改好友备注成功响应',
            value: redactSensitive(updateFriendAliasResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/{id}/block',
        method: 'patch',
        request: {
          name: 'updateFriendBlockRequest',
          summary: '拉黑好友请求',
          value: updateFriendBlockBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateFriendBlockSuccess',
            summary: '拉黑好友成功响应',
            value: redactSensitive(updateFriendBlockResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/{id}/best',
        method: 'post',
        responses: [
          {
            status: '201',
            name: 'bindBestFriendSuccess',
            summary: '绑定亲密好友成功响应',
            value: redactSensitive(bindBestFriendResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/devices/snapshots',
        method: 'post',
        request: {
          name: 'createDeviceSnapshotRequest',
          summary: '上报设备状态请求',
          value: deviceSnapshotBody,
        },
        responses: [
          {
            status: '201',
            name: 'createDeviceSnapshotSuccess',
            summary: '上报设备状态成功响应',
            value: redactSensitive(createDeviceSnapshotResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/devices/me/snapshots/latest',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'myLatestDeviceSnapshotSuccess',
            summary: '查询当前用户最新设备状态成功响应',
            value: redactSensitive(myLatestDeviceSnapshotResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/devices/me/snapshots',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'myDeviceSnapshotsSuccess',
            summary: '查询当前用户设备历史成功响应',
            value: redactSensitive(myDeviceSnapshotsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/devices/users/{userId}/snapshots',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'friendDeviceSnapshotsSuccess',
            summary: '查询好友设备历史成功响应',
            value: redactSensitive(friendDeviceSnapshotsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/devices/users/{userId}/snapshots/latest',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'friendLatestDeviceSnapshotSuccess',
            summary: '查询好友最新设备状态成功响应',
            value: redactSensitive(friendLatestDeviceSnapshotResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/devices/users/{userId}/location-request',
        method: 'post',
        responses: [
          {
            status: '201',
            name: 'requestLocationSuccess',
            summary: '请求好友位置成功响应',
            value: redactSensitive(requestLocationResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/plans',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'vipPlansSuccess',
            summary: '查询 VIP 套餐成功响应',
            value: redactSensitive(vipPlansResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/plans',
        method: 'post',
        request: {
          name: 'createVipPlanRequest',
          summary: '管理员创建 VIP 套餐请求',
          value: createVipPlanBody,
        },
        responses: [
          {
            status: '201',
            name: 'createVipPlanSuccess',
            summary: '管理员创建 VIP 套餐成功响应',
            value: redactSensitive(createVipPlanResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/plans/{id}',
        method: 'patch',
        request: {
          name: 'updateVipPlanRequest',
          summary: '管理员更新 VIP 套餐请求',
          value: updateVipPlanBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateVipPlanSuccess',
            summary: '管理员更新 VIP 套餐成功响应',
            value: redactSensitive(updateVipPlanResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/orders',
        method: 'post',
        request: {
          name: 'createVipOrderRequest',
          summary: '开通 VIP 请求',
          value: createVipOrderBody,
        },
        responses: [
          {
            status: '201',
            name: 'createVipOrderSuccess',
            summary: '开通 VIP 成功响应',
            value: redactSensitive(createVipOrderResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/orders',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'listVipOrdersSuccess',
            summary: '管理员查询 VIP 订单成功响应',
            value: redactSensitive(listVipOrdersResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/orders/me',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'myVipOrdersSuccess',
            summary: '查询我的 VIP 订单成功响应',
            value: redactSensitive(myVipOrdersResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/vip/bindings',
        method: 'post',
        request: {
          name: 'bindVipRequest',
          summary: '绑定双人会员名额请求',
          value: bindVipBody,
        },
        responses: [
          {
            status: '201',
            name: 'bindVipSuccess',
            summary: '绑定双人会员名额成功响应',
            value: redactSensitive(bindVipResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/app-config/app',
        method: 'patch',
        request: {
          name: 'updateAppConfigRequest',
          summary: '更新 App 启动配置请求',
          value: updateAppConfigBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateAppConfigSuccess',
            summary: '更新 App 启动配置成功响应',
            value: redactSensitive(updateAppConfigResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/app-config/app',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'appConfigSuccess',
            summary: '查询 App 启动配置成功响应',
            value: redactSensitive(appConfigResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/announcements',
        method: 'post',
        request: {
          name: 'createAnnouncementRequest',
          summary: '创建公告请求',
          value: createAnnouncementBody,
        },
        responses: [
          {
            status: '201',
            name: 'createAnnouncementSuccess',
            summary: '创建公告成功响应',
            value: redactSensitive(createAnnouncementResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/announcements',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'listAnnouncementsSuccess',
            summary: '分页查询公告成功响应',
            value: redactSensitive(listAnnouncementsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/announcements/latest',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'latestAnnouncementSuccess',
            summary: '查询最新公告成功响应',
            value: redactSensitive(latestAnnouncementResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/feedback',
        method: 'post',
        request: {
          name: 'createFeedbackRequest',
          summary: '提交意见反馈请求',
          value: createFeedbackBody,
        },
        responses: [
          {
            status: '201',
            name: 'createFeedbackSuccess',
            summary: '提交意见反馈成功响应',
            value: redactSensitive(createFeedbackResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/feedback',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'listFeedbackSuccess',
            summary: '管理员分页查看反馈成功响应',
            value: redactSensitive(listFeedbackResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/versions',
        method: 'post',
        request: {
          name: 'createVersionRequest',
          summary: '发布版本请求',
          value: createVersionBody,
        },
        responses: [
          {
            status: '201',
            name: 'createVersionSuccess',
            summary: '发布版本成功响应',
            value: redactSensitive(createVersionResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/versions/latest',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'latestVersionSuccess',
            summary: '查询最新版本成功响应',
            value: redactSensitive(latestVersionResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/memoirs',
        method: 'post',
        request: {
          name: 'createMemoirRequest',
          summary: '创建回忆录请求',
          value: createMemoirBody,
        },
        responses: [
          {
            status: '201',
            name: 'createMemoirSuccess',
            summary: '创建回忆录成功响应',
            value: redactSensitive(createMemoirResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/memoirs/{id}',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'getMemoirSuccess',
            summary: '查询回忆录详情成功响应',
            value: redactSensitive(getMemoirResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/memoirs',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'listMemoirsSuccess',
            summary: '查询回忆录列表成功响应',
            value: redactSensitive(listMemoirsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/memoirs/{id}',
        method: 'patch',
        request: {
          name: 'updateMemoirRequest',
          summary: '更新回忆录请求',
          value: updateMemoirBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateMemoirSuccess',
            summary: '更新回忆录成功响应',
            value: redactSensitive(updateMemoirResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/moments',
        method: 'post',
        request: {
          name: 'createMomentRequest',
          summary: '创建瞬间请求',
          value: createMomentBody,
        },
        responses: [
          {
            status: '201',
            name: 'createMomentSuccess',
            summary: '创建瞬间成功响应',
            value: redactSensitive(createMomentResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/moments/{id}',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'getMomentSuccess',
            summary: '查询瞬间详情成功响应',
            value: redactSensitive(getMomentResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/moments',
        method: 'get',
        responses: [
          {
            status: '200',
            name: 'listMomentsSuccess',
            summary: '查询瞬间列表成功响应',
            value: redactSensitive(listMomentsResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/moments/{id}',
        method: 'patch',
        request: {
          name: 'updateMomentRequest',
          summary: '更新瞬间请求',
          value: updateMomentBody,
        },
        responses: [
          {
            status: '200',
            name: 'updateMomentSuccess',
            summary: '更新瞬间成功响应',
            value: redactSensitive(updateMomentResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/moments/{id}',
        method: 'delete',
        responses: [
          {
            status: '200',
            name: 'deleteMomentSuccess',
            summary: '删除瞬间成功响应',
            value: redactSensitive(deleteMomentResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/memoirs/{id}',
        method: 'delete',
        responses: [
          {
            status: '200',
            name: 'deleteMemoirSuccess',
            summary: '删除回忆录成功响应',
            value: redactSensitive(deleteMemoirResponse.body),
          },
        ],
      },
      {
        path: '/api/v1/friends/{id}',
        method: 'delete',
        responses: [
          {
            status: '200',
            name: 'deleteFriendSuccess',
            summary: '删除好友成功响应',
            value: redactSensitive(deleteFriendResponse.body),
          },
        ],
      },
    ],
  };

  await writeExamplesFile(examplesFile);
  console.log(`Swagger 真实示例已生成：${OUTPUT_PATH}`);
}

async function assertSwaggerAvailable(baseUrl: string): Promise<void> {
  try {
    await request<unknown>(baseUrl, {
      method: 'get',
      path: '/api/docs-json',
      expectedStatus: 200,
    });
  } catch (error: unknown) {
    throw new Error(
      `无法访问 ${baseUrl}/api/docs-json，请先启动本地服务。原始错误：${getErrorMessage(error)}`,
    );
  }
}

async function request<TResponse>(
  baseUrl: string,
  options: RequestOptions,
): Promise<{ status: number; body: TResponse }> {
  const response = await fetch(`${baseUrl}${options.path}`, {
    method: options.method.toUpperCase(),
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options.token ? { Authorization: options.token } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const body = parseJson<TResponse>(text, options.path);
  if (
    options.expectedStatus !== undefined &&
    response.status !== options.expectedStatus
  ) {
    throw new Error(
      `${options.method.toUpperCase()} ${options.path} 期望 HTTP ${options.expectedStatus}，实际 HTTP ${response.status}：${text}`,
    );
  }
  return {
    status: response.status,
    body,
  };
}

async function createPasswordResetCode(
  email: string,
  userId: string,
  verifyCode: string,
): Promise<void> {
  const connectionString = requireRuntimeValue(
    'DATABASE_URL',
    process.env.DATABASE_URL,
  );
  const prisma = new PrismaClient({
    adapter: new PrismaPg(connectionString),
  });
  try {
    await prisma.verificationCode.create({
      data: {
        userId: BigInt(userId),
        email,
        codeHash: await bcrypt.hash(verifyCode, 12),
        purpose: VerificationPurpose.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

function parseJson<TValue>(text: string, path: string): TValue {
  try {
    return JSON.parse(text) as TValue;
  } catch {
    throw new Error(`${path} 返回的内容不是合法 JSON：${text}`);
  }
}

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(value)) {
    if (key.toLowerCase().includes('token')) {
      result[key] = REDACTED_TOKEN;
      continue;
    }
    if (key.toLowerCase().includes('password')) {
      result[key] = REDACTED_PASSWORD;
      continue;
    }
    result[key] = redactSensitive(childValue);
  }
  return result;
}

async function writeExamplesFile(file: CapturedExamplesFile): Promise<void> {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  const tempPath = `${OUTPUT_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  await assertNoSensitiveContent(tempPath);
  await rename(tempPath, OUTPUT_PATH);
}

async function assertNoSensitiveContent(path: string): Promise<void> {
  const content = await readFile(path, 'utf8');
  const forbiddenPatterns = [
    /Bearer\s+eyJ/i,
    /DATABASE_URL/i,
    /postgresql:\/\//i,
    /123123123/,
    /wrong-password/,
    /2468/,
  ];
  const failedPattern = forbiddenPatterns.find((pattern) =>
    pattern.test(content),
  );
  if (failedPattern) {
    throw new Error(`生成文件包含敏感内容，已阻止写入：${failedPattern}`);
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function requireRuntimeValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (
    !normalized ||
    /^<|example\.com|ChangeMe_|replace-with/i.test(normalized)
  ) {
    throw new Error(`${name} 未配置为真实可用值`);
  }
  return normalized;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error: unknown) => {
  console.error(getErrorMessage(error));
  process.exit(1);
});
