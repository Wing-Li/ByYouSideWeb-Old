package com.lyl.byyouside.utils

import java.nio.charset.StandardCharsets
import java.util.*
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * AES加密解密
 */
object AESHelper {

    private const val ALGORITHM = "AES/CBC/PKCS5Padding"
    private const val MY_KEY = "HkLnLKjlkNlkKhHKnlkscaaKJDSADSAW"
    private const val MY_IV = "0123465798123456"

    /**
     * 加密
     */
    fun encrypt(plainText: String): String {
        val keySpec = SecretKeySpec(MY_KEY.toByteArray(), "AES")
        val ivSpec = IvParameterSpec(MY_IV.toByteArray())

        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec)
        val encryptedBytes = cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8))
        val encryptedBase64 = Base64.getEncoder().encodeToString(encryptedBytes)
        return encryptedBase64
    }

    /**
     * 解密
     */
    fun decrypt(encryptedText: String): String {
        val keySpec = SecretKeySpec(MY_KEY.toByteArray(), "AES")
        val ivSpec = IvParameterSpec(MY_IV.toByteArray())

        return try {
            val cipher = Cipher.getInstance(ALGORITHM)
            cipher.init(Cipher.DECRYPT_MODE, keySpec)
            val decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText))
            val decryptedText = String(decryptedBytes, StandardCharsets.UTF_8)
            decryptedText
        } catch (e: Exception) {
            ""
        }
    }


}

