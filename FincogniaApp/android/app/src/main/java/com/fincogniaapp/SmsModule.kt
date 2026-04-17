package com.fincogniaapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SmsModule"
    }

    /**
     * Check if SMS permission is granted
     */
    @ReactMethod
    fun hasPermission(promise: Promise) {
        val permission = Manifest.permission.READ_SMS
        val granted = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            permission
        ) == PackageManager.PERMISSION_GRANTED
        
        promise.resolve(granted)
    }

    /**
     * Request SMS permission
     * Note: Actual permission request is handled by React Native's PermissionsAndroid
     * This method just checks the current permission status
     */
    @ReactMethod
    fun requestPermission(promise: Promise) {
        val permission = Manifest.permission.READ_SMS
        val hasPermission = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            permission
        ) == PackageManager.PERMISSION_GRANTED

        // Return current status - actual request is done via PermissionsAndroid in JS
        promise.resolve(hasPermission)
    }

    /**
     * Read SMS messages
     * @param limit Maximum number of messages to read (default: 100)
     * @param sender Optional sender filter (phone number)
     */
    @ReactMethod
    fun readSms(limit: Int, sender: String?, promise: Promise) {
        try {
            // Check permission
            val permission = Manifest.permission.READ_SMS
            val hasPermission = ContextCompat.checkSelfPermission(
                reactApplicationContext,
                permission
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasPermission) {
                promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted")
                return
            }

            val messages = readSmsMessages(limit, sender)
            promise.resolve(messages)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to read SMS: ${e.message}", e)
        }
    }

    /**
     * Get SMS from specific sender
     */
    @ReactMethod
    fun getSmsFromSender(sender: String, limit: Int, promise: Promise) {
        readSms(limit, sender, promise)
    }

    /**
     * Internal method to read SMS messages
     */
    private fun readSmsMessages(limit: Int, senderFilter: String?): WritableArray {
        val messages = Arguments.createArray()
        val uri = Uri.parse("content://sms/inbox")
        
        val projection = arrayOf(
            Telephony.Sms._ID,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE,
            Telephony.Sms.DATE_SENT
        )

        var selection: String? = null
        var selectionArgs: Array<String>? = null

        if (!senderFilter.isNullOrBlank()) {
            selection = "${Telephony.Sms.ADDRESS} LIKE ?"
            selectionArgs = arrayOf("%$senderFilter%")
        }

        val sortOrder = "${Telephony.Sms.DATE} DESC"

        val cursor: Cursor? = reactApplicationContext.contentResolver.query(
            uri,
            projection,
            selection,
            selectionArgs,
            sortOrder
        )

        cursor?.use {
            val idIndex = it.getColumnIndex(Telephony.Sms._ID)
            val addressIndex = it.getColumnIndex(Telephony.Sms.ADDRESS)
            val bodyIndex = it.getColumnIndex(Telephony.Sms.BODY)
            val dateIndex = it.getColumnIndex(Telephony.Sms.DATE)
            val dateSentIndex = it.getColumnIndex(Telephony.Sms.DATE_SENT)

            var count = 0
            while (it.moveToNext() && count < limit) {
                val message = Arguments.createMap().apply {
                    putString("id", if (idIndex >= 0) it.getString(idIndex) else "")
                    putString("address", if (addressIndex >= 0) it.getString(addressIndex) else "")
                    putString("body", if (bodyIndex >= 0) it.getString(bodyIndex) else "")
                    // DATE is in milliseconds since epoch
                    putDouble("date", if (dateIndex >= 0) it.getLong(dateIndex).toDouble() else 0.0)
                    if (dateSentIndex >= 0 && !it.isNull(dateSentIndex)) {
                        putDouble("dateSent", it.getLong(dateSentIndex).toDouble())
                    }
                }
                messages.pushMap(message)
                count++
            }
        }

        cursor?.close()
        return messages
    }
}

