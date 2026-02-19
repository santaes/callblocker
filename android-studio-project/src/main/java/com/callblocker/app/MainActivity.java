package com.callblocker.app;

import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {
    
    @Override
    protected String getMainComponentName() {
        return "CallBlocker";
    }
    
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            DefaultNewArchitectureEntryPoint.getFabricEnabled(), // If enabled in fabric
            DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // If concurrent root is enabled
        );
    }
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}
