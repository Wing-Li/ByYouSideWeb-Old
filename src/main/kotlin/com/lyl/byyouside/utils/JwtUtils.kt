package com.lyl.byyouside.utils;

import cn.hutool.core.date.DateUtil;
import cn.hutool.jwt.JWT;
import cn.hutool.jwt.JWTUtil;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * @author llh
 */
public class JwtUtils {
    /**
     * 令牌密码 不少于32位
     */
    private static final String SECRET = "F8:4B:F8:F3:5A:E8:3F:47:31:C5:AE:3F:7C:44:AA:1D:CB:D7:A7:BA:55:F2:4A:4D:CF:18:69:36:F4:00:0B:DE";

    /**
     * 令牌前缀
     */
    private static final String TOKEN_PREFIX = "Bearer";

    /**
     * 令牌过期时间
     */
    private static final long EXPIRE_SECONDS = 1000 * 60 * 60 * 24 * 365L;


    /**
     * 生成令牌
     */
    public static String createToken(long userId) {
        Map<String, Object> headerMap = new HashMap<String, Object>() {
            private static final long serialVersionUID = 1L;

            {
                put("userId", userId);
                put("expireTime", System.currentTimeMillis() + EXPIRE_SECONDS);
            }
        };
        Map<String, Object> payloadMap = new HashMap<>();

        String token = JWTUtil.createToken(headerMap, payloadMap, SECRET.getBytes());

        return TOKEN_PREFIX + " " + token;
    }

    /**
     * 验证令牌
     */
    public static boolean verifyToken(String token) {
        if (token == null) {
            throw new RuntimeException("令牌为空");
        }

        try {
            return JWTUtil.verify(token, SECRET.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("令牌解析异常");
        }
    }

    /**
     * 解析令牌
     */
    public static Map<String, Object> parseToken(String token) {
        if (token == null) {
            throw new RuntimeException("令牌为空");
        }

        try {
            JWT jwt = JWTUtil.parseToken(token);
            String userId = (String) jwt.getHeader("userId");
            Long expireTime = (Long) jwt.getHeader("expireTime");

            Map<String, Object> map = new HashMap<String, Object>();
            map.put("userId", userId);
            map.put("expireTime", expireTime);

            return map;
        } catch (Exception e) {
            throw new RuntimeException("令牌解析异常");
        }
    }

}
