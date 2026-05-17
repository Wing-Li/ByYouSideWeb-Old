import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

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

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_DEMO_EMAIL = 'yyy101@yy.com';
const DEFAULT_DEMO_PASSWORD = '123123123';
const OUTPUT_PATH = join('docs', 'swagger', 'openapi-examples.json');
const REDACTED_TOKEN = 'Bearer <captured-jwt-redacted>';
const REDACTED_PASSWORD = '<demo-password>';

async function main(): Promise<void> {
  const baseUrl = normalizeBaseUrl(
    process.env.API_BASE_URL ?? DEFAULT_BASE_URL,
  );
  const demoEmail = process.env.SWAGGER_DEMO_EMAIL ?? DEFAULT_DEMO_EMAIL;
  const demoPassword =
    process.env.SWAGGER_DEMO_PASSWORD ?? DEFAULT_DEMO_PASSWORD;
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

  await assertSwaggerAvailable(baseUrl);

  const registerResponse = await request<ApiResponseBody<unknown>>(baseUrl, {
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

  const token = loginResponse.body.data.token;
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
  const generatedUserToken = (
    registerResponse.body as ApiResponseBody<{ token: string }>
  ).data.token;
  const friendUserToken = friendRegisterResponse.body.data.token;
  const friendUserId = friendRegisterResponse.body.data.user.id;
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error: unknown) => {
  console.error(getErrorMessage(error));
  process.exit(1);
});
