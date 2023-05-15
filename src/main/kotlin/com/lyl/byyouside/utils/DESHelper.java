package com.lyl.byyouside.utils;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESKeySpec;
import java.security.SecureRandom;

/**
 * @author huang_guoqiang
 * @desc DES加解密
 * @date 2017/11/14 11:38
 * <p>
 * DES加密介绍
 * DES是一种对称加密算法，所谓对称加密算法即：加密和解密使用相同密钥的算法。DES加密算法出自IBM的研究，
 * 后来被美国政府正式采用，之后开始广泛流传，但是近些年使用越来越少，因为DES使用56位密钥，以现代计算能力，
 * 24小时内即可被破解。虽然如此，在某些简单应用中，我们还是可以使用DES加密算法，本文简单讲解DES的JAVA实现。
 * 注意：DES加密和解密过程中，密钥长度都必须是8的倍数
 */
public class DESHelper {

    private final static String DES = "DES";
    private final static String KEY = "xOsmaiJv";

    public static String encrypt(String pliantext) throws Exception {
        return encodeBase64(encryptDES(pliantext, KEY));
    }

    public static String decrypt(String ciphertext) throws Exception {
        return decryptDES(decodeBase64(ciphertext), KEY);
    }

    /**
     * 编码
     */
    private static String encodeBase64(byte[] binaryData) {
        StringBuilder hexString = new StringBuilder();
        for (int i = 0; i < binaryData.length; i++) {
            String plainText = Integer.toHexString(0xff & binaryData[i]);
            if (plainText.length() < 2) plainText = "0" + plainText;
            hexString.append(plainText);
        }

        return hexString.toString();
    }

    /**
     * 解码
     */
    private static byte[] decodeBase64(String binaryData) {
        byte digest[] = new byte[binaryData.length() / 2];
        for (int i = 0; i < digest.length; i++) {
            String byteString = binaryData.substring(2 * i, 2 * i + 2);
            int byteValue = Integer.parseInt(byteString, 16);
            digest[i] = (byte) byteValue;
        }

        return digest;
    }

    /**
     * DES 加密
     */
    private static byte[] encryptDES(String data, String key) {
        try {
            // 生成一个可信任的随机数源 ,  SHA1PRNG: 仅指定算法名称
            SecureRandom random = SecureRandom.getInstance("SHA1PRNG");
            // 从原始密钥数据创建DESKeySpec对象
            DESKeySpec deskey = new DESKeySpec(key.getBytes("UTF-8"));

            //创建一个密匙工厂，然后用它把DESKeySpec转换成
            SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DES);
            SecretKey secretKey = keyFactory.generateSecret(deskey);
            //Cipher对象实际完成加密操作
            Cipher cipher = Cipher.getInstance(DES);
            //用密匙初始化Cipher对象,
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, random);
            //现在，获取数据并加密
            //正式执行加密操作
            return cipher.doFinal(data.getBytes("UTF-8"));

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * DES 解密
     */
    private static String decryptDES(byte[] data, String key) {
        try {
            // 算法要求有一个可信任的随机数源,  SHA1PRNG: 仅指定算法名称
            SecureRandom random = SecureRandom.getInstance("SHA1PRNG");
            // 创建一个DESKeySpec对象
            DESKeySpec desKeySpec = new DESKeySpec(key.getBytes("UTF-8"));
            // 创建一个密匙工厂
            SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DES);
            // 将DESKeySpec对象转换成SecretKey对象
            SecretKey secretKey = keyFactory.generateSecret(desKeySpec);
            // Cipher对象实际完成解密操作
            Cipher cipher = Cipher.getInstance(DES);
            // 用密匙初始化Cipher对象
            cipher.init(Cipher.DECRYPT_MODE, secretKey, random);
            // 真正开始解密操作
            return new String(cipher.doFinal(data), "UTF-8");

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

//    public static void main(String[] args) throws Exception {
//        long s = System.currentTimeMillis();
//        String v = "// 算法要求有一个可信任的随机数源,  SHA1PRNG: 仅指定算法名称\n" +
//                "            SecureRandom random = SecureRandom.getInstance(\"SHA1PRNG\");\n" +
//                "            // 创建一个DESKeySpec对象\n" +
//                "            DESKeySpec desKeySpec = new DESKeySpec(key.getBytes(\"UTF-8\"));\n" +
//                "            // 创建一个密匙工厂\n" +
//                "            SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DES);";
//
//        String enString = encrypt(v);
//        System.out.println("加密后的字串是：" + enString);
//        String deString = decrypt(enString);
//        System.out.println("解密后的字串是：" + deString);
//
//        System.out.println("shijian：" + (System.currentTimeMillis() - s));
//    }

}