# HƯỚNG DẪN XUẤT FILE CHI TIẾT

## 🍎 XUẤT FILE IPA (iOS)

### Option 1: EAS Build - Cloud Build (DỄ NHẤT ⭐)

**Ưu điểm:**
- Không cần macOS
- Không cần Xcode
- Build trên cloud của Expo
- Dễ dàng cho người mới

**Các bước thực hiện:**

1. **Cài đặt EAS CLI**
```bash
npm install -g eas-cli
```

2. **Đăng nhập Expo (Tạo tài khoản miễn phí tại expo.dev)**
```bash
eas login
```

3. **Khởi tạo EAS trong project**
```bash
eas build:configure
```

4. **Build cho testing (không cần Apple Developer Account)**
```bash
eas build --platform ios --profile development
```

Hoặc build cho production:
```bash
eas build --platform ios --profile production
```

5. **Theo dõi quá trình build**
- Bạn sẽ thấy link theo dõi trên terminal
- Truy cập https://expo.dev để xem tiến độ
- Build sẽ mất khoảng 10-20 phút

6. **Tải file IPA**
- Khi build xong, click vào link download
- File IPA sẽ được tải về máy

**Cài đặt IPA lên iPhone:**

A. **Sử dụng Expo Go (Test nhanh):**
- Tải app "Expo Go" từ App Store
- Quét QR code khi chạy `npm start`
- App sẽ chạy trong Expo Go

B. **Sử dụng TestFlight (Apple):**
```bash
eas submit --platform ios
```
- Cần Apple Developer Account ($99/năm)
- App sẽ available qua TestFlight

C. **Cài đặt trực tiếp (Development build):**
- Sử dụng Apple Configurator 2 (macOS)
- Hoặc dùng các tool như Sideloadly, AltStore

### Option 2: Build Local với Xcode (CẦN macOS)

**Yêu cầu:**
- macOS với Xcode đã cài đặt
- Apple Developer Account (cho device thật)

**Các bước:**

1. **Eject project từ Expo**
```bash
npx expo prebuild --platform ios
```

2. **Cài đặt dependencies**
```bash
cd ios
pod install
cd ..
```

3. **Mở project trong Xcode**
```bash
open ios/lotoapp.xcworkspace
```

4. **Cấu hình Signing trong Xcode:**
- Click vào project trong sidebar trái
- Chọn tab "Signing & Capabilities"
- Check "Automatically manage signing"
- Chọn Team (cần Apple ID)
- Đổi Bundle Identifier nếu cần

5. **Chọn device:**
- Ở thanh toolbar trên, chọn "Any iOS Device (arm64)"

6. **Archive app:**
- Menu: Product → Archive
- Đợi build hoàn tất (5-10 phút)

7. **Distribute app:**
- Khi archive xong, cửa sổ Organizer mở ra
- Click "Distribute App"
- Chọn method:
  * **Development**: Test trên device development
  * **Ad Hoc**: Cài trên tối đa 100 devices
  * **App Store**: Submit lên App Store

8. **Export IPA:**
- Làm theo wizard
- Chọn folder lưu IPA
- File IPA sẽ nằm trong folder bạn chọn

**Cài đặt IPA:**
- Kết nối iPhone qua USB
- Mở Xcode → Window → Devices and Simulators
- Drag & drop file IPA vào device

---

## 🤖 XUẤT FILE APK/AAB (ANDROID)

### Option 1: EAS Build - Cloud Build (DỄ NHẤT ⭐)

**Ưu điểm:**
- Không cần Android Studio
- Build trên cloud
- Dễ dàng cho người mới

**Xuất APK (để test và cài đặt trực tiếp):**

```bash
# Build APK
eas build --platform android --profile preview
```

**Xuất AAB (để upload lên Google Play Store):**

```bash
# Build AAB (Android App Bundle)
eas build --platform android --profile production
```

**Theo dõi và tải file:**
1. Theo dõi build tại terminal hoặc expo.dev
2. Khi xong, tải file về
3. Cài đặt APK trực tiếp lên Android hoặc upload AAB lên Play Console

**Cài đặt APK lên Android:**
- Chuyển file APK vào điện thoại
- Bật "Install from unknown sources" trong Settings
- Tap vào file APK để cài đặt

### Option 2: Build Local (CẦN Android Studio)

**Yêu cầu:**
- Android Studio đã cài đặt
- Java JDK

#### A. Chuẩn bị

1. **Eject từ Expo:**
```bash
npx expo prebuild --platform android
```

2. **Set ANDROID_HOME environment:**

MacOS/Linux:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Windows:
```
ANDROID_HOME = C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```

#### B. Tạo Keystore (BẮT BUỘC cho Production)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Nhập thông tin:
- Password cho keystore (LƯU LẠI!)
- Tên, organization, city, etc.

**⚠️ QUAN TRỌNG:** Sao lưu file `.keystore` và password. Mất nó = không thể update app!

#### C. Cấu hình Signing

Tạo file `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_PASSWORD_HERE
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_PASSWORD_HERE
```

Thêm vào `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

#### D. Build APK

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

File APK: `android/app/build/outputs/apk/release/app-release.apk`

#### E. Build AAB (cho Google Play)

```bash
cd android
./gradlew bundleRelease
```

File AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Option 3: Build APK không signing (CHỈ TEST)

```bash
cd android
./gradlew assembleDebug
```

File: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📊 SO SÁNH PHƯƠNG PHÁP

### iOS:

| Phương pháp | Độ khó | Yêu cầu | Thời gian | Chi phí |
|-------------|--------|---------|-----------|---------|
| EAS Build | ⭐ Dễ | Internet, Expo account | 10-20 phút | Free (có giới hạn) |
| Xcode Local | ⭐⭐⭐ Khó | macOS, Xcode | 5-10 phút | Free (cần Mac) |
| Expo Go | ⭐ Rất dễ | Expo Go app | 1 phút | Free |

### Android:

| Phương pháp | Độ khó | Yêu cầu | Thời gian | Chi phí |
|-------------|--------|---------|-----------|---------|
| EAS Build | ⭐ Dễ | Internet, Expo account | 10-15 phút | Free (có giới hạn) |
| Local Build | ⭐⭐ Trung bình | Android Studio, JDK | 5-10 phút | Free |
| Debug Build | ⭐ Dễ | Android Studio | 3-5 phút | Free |

---

## 🚀 KHUYẾN NGHỊ CHO NGƯỜI MỚI

### Nếu bạn muốn TEST nhanh:
- **iOS**: Dùng Expo Go app
- **Android**: Build APK debug hoặc dùng EAS Build

### Nếu bạn muốn PHÂN PHỐI:
- **Cả iOS & Android**: Dùng EAS Build
  - Dễ nhất
  - Không cần setup phức tạp
  - Free tier: 30 builds/tháng

### Nếu bạn là DEVELOPER có kinh nghiệm:
- **iOS**: Build local với Xcode (nếu có Mac)
- **Android**: Build local với Gradle

---

## 💡 TIPS & TRICKS

### 1. Test trước khi build:
```bash
# Test trên simulator
npm run ios
npm run android
```

### 2. Clear cache nếu lỗi:
```bash
# Expo
expo start -c

# iOS
cd ios && pod install && cd ..

# Android
cd android && ./gradlew clean && cd ..
```

### 3. Giảm size app:
- Trong `app.json`, thêm:
```json
"assetBundlePatterns": [
  "assets/images/*",
  "assets/fonts/*"
]
```

### 4. Check version trước build:
- Tăng version trong `app.json`
- iOS: `expo.version` và `expo.ios.buildNumber`
- Android: `expo.version` và `expo.android.versionCode`

### 5. Build history với EAS:
```bash
# Xem lịch sử builds
eas build:list
```

---

## 🆘 TROUBLESHOOTING

### iOS: "Signing for requires a development team"
→ Cần Apple Developer account hoặc thêm Apple ID vào Xcode

### Android: "Task :app:validateSigningRelease FAILED"
→ Check keystore path và passwords trong gradle.properties

### EAS Build: "Build failed"
→ Check logs tại expo.dev, thường là lỗi dependencies

### APK không cài được:
→ Enable "Install from unknown sources" trong Settings

### IPA không cài được:
→ Kiểm tra provisioning profile và signing certificate

---

## 📞 HỖ TRỢ

- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

**Chúc bạn thành công! 🎉**
