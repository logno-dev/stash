package com.stash.bookmarkmanager

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  
  companion object {
    private const val TAG = "MainActivity"
  }
  
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
  }
  
  override fun onResume() {
    super.onResume()
    handleSharedContent(intent)
  }
  
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    intent?.let { handleSharedContent(it) }
  }
  
  private fun handleSharedContent(intent: Intent) {
    Log.d(TAG, "handleSharedContent called with action: ${intent.action}")
    
    when (intent.action) {
      Intent.ACTION_SEND -> {
        Log.d(TAG, "ACTION_SEND detected with type: ${intent.type}")
        if (intent.type == "text/plain") {
          val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
          val sharedSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT)
          
          Log.d(TAG, "Shared text: $sharedText")
          Log.d(TAG, "Shared subject: $sharedSubject")
          
          if (sharedText != null) {
            // Convert to custom URL scheme and restart the activity
            val shareUrl = buildShareUrl(sharedText, sharedSubject)
            Log.d(TAG, "Created share URL: $shareUrl")
            
            // Create new intent with the custom URL
            val newIntent = Intent(Intent.ACTION_VIEW, Uri.parse(shareUrl))
            newIntent.setClass(this, MainActivity::class.java)
            newIntent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            
            // Clear the original intent to prevent re-processing
            intent.action = null
            
            // Start the new intent
            startActivity(newIntent)
            return
          }
        }
      }
    }
  }
  
  private fun buildShareUrl(text: String, subject: String?): String {
    val encodedText = java.net.URLEncoder.encode(text, "UTF-8")
    val encodedSubject = subject?.let { java.net.URLEncoder.encode(it, "UTF-8") }
    
    return if (text.startsWith("http://") || text.startsWith("https://")) {
      "stash://add?url=$encodedText" + if (encodedSubject != null) "&title=$encodedSubject" else ""
    } else {
      "stash://add?text=$encodedText" + if (encodedSubject != null) "&title=$encodedSubject" else ""
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
