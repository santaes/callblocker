package com.callblocker.app;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.soloader.SoLoader;

public class MainApplication extends Application implements ReactApplication {
    
    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        protected String getJSMainModuleName() {
            return "CallBlocker";
        }
        
        @Override
        protected boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }
        
        @Override
        protected String getBundleAssetName() {
            return "index.android.bundle";
        }
        
        @Override
        protected PackageList getPackages() {
            return new PackageList();
        }
        
        @Override
        protected String getJSMainModulePath() {
            return "index";
        }
        
        @Override
        protected boolean isNewArchEnabled() {
            return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }
        
        @Override
        protected boolean isHermesEnabled() {
            return BuildConfig.IS_HERMES_ENABLED;
        }
    };
    
    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this);
    }
}
