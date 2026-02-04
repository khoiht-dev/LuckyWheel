# 🎰 Ứng Dụng Loto - React Native

Ứng dụng Loto được xây dựng bằng React Native với Expo, cho phép người dùng chọn số và chơi xổ số loto.

## ✨ Tính năng

- ✅ Chọn 6 số từ 1-45
- ✅ Quay số ngẫu nhiên
- ✅ Hiển thị kết quả trúng số
- ✅ Lưu lịch sử chơi
- ✅ Giao diện đẹp, dễ sử dụng
- ✅ Hỗ trợ iOS và Android

## 🚀 Cài đặt và chạy

### Yêu cầu

- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn
- Expo CLI
- Xcode (cho iOS - chỉ trên macOS)
- Android Studio (cho Android)

### Bước 1: Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### Bước 2: Chạy ứng dụng

```bash
# Khởi động Expo
npm start

# Chạy trên iOS simulator
npm run ios

# Chạy trên Android emulator
npm run android
```

## 📱 Xuất file IPA (iOS)

### Phương pháp 1: Sử dụng EAS Build (Khuyến nghị)

EAS Build là dịch vụ build của Expo, dễ sử dụng nhất.

#### Bước 1: Cài đặt EAS CLI

```bash
npm install -g eas-cli
```

#### Bước 2: Đăng nhập Expo

```bash
eas login
```

#### Bước 3: Cấu hình EAS

```bash
eas build:configure
```

#### Bước 4: Build IPA

```bash
# Build cho simulator (testing)
eas build --platform ios --profile development

# Build cho App Store
eas build --platform ios --profile production
```

#### Bước 5: Tải file IPA

Sau khi build xong, bạn sẽ nhận được link để tải file IPA từ trang web Expo.

### Phương pháp 2: Build local với Xcode (Nâng cao)

#### Bước 1: Eject từ Expo

```bash
npx expo prebuild
```

Lệnh này sẽ tạo thư mục `ios/` và `android/`

#### Bước 2: Cài đặt CocoaPods dependencies

```bash
cd ios
pod install
cd ..
```

#### Bước 3: Mở project trong Xcode

```bash
open ios/lotoapp.xcworkspace
```

#### Bước 4: Cấu hình trong Xcode

1. Chọn team development của bạn trong **Signing & Capabilities**
2. Đảm bảo Bundle Identifier là duy nhất (vd: `com.yourname.lotoapp`)
3. Chọn device target là **Any iOS Device (arm64)**

#### Bước 5: Archive ứng dụng

1. Trong Xcode, chọn **Product > Archive**
2. Đợi quá trình build hoàn tất
3. Trong cửa sổ Archives, chọn **Distribute App**
4. Chọn phương thức phân phối:
   - **Ad Hoc**: Để cài đặt trên thiết bị test
   - **App Store**: Để submit lên App Store
   - **Development**: Để test trên thiết bị development

#### Bước 6: Export IPA

1. Làm theo các bước trong wizard
2. Chọn thư mục để lưu file IPA
3. File IPA sẽ được tạo ra trong thư mục bạn chọn

### Phương pháp 3: Sử dụng Expo Go (Testing nhanh)

Cách này KHÔNG tạo IPA nhưng cho phép test nhanh:

```bash
npm start
```

Quét QR code bằng app Expo Go trên iPhone.

## 🤖 Xuất file APK/AAB (Android)

### Phương pháp 1: Sử dụng EAS Build (Khuyến nghị)

#### Bước 1: Build APK (cho testing)

```bash
# Build APK để cài đặt trực tiếp
eas build --platform android --profile preview
```

#### Bước 2: Build AAB (cho Google Play Store)

```bash
# Build AAB để upload lên Play Store
eas build --platform android --profile production
```

#### Bước 3: Tải file

Sau khi build xong, tải file APK/AAB từ link được cung cấp.

### Phương pháp 2: Build local (Nâng cao)

#### Bước 1: Eject từ Expo

```bash
npx expo prebuild
```

#### Bước 2: Build APK

```bash
cd android
./gradlew assembleRelease
```

File APK sẽ ở: `android/app/build/outputs/apk/release/app-release.apk`

#### Bước 3: Build AAB (cho Play Store)

```bash
cd android
./gradlew bundleRelease
```

File AAB sẽ ở: `android/app/build/outputs/bundle/release/app-release.aab`

### Ký file APK/AAB (Cần thiết cho production)

#### Tạo keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### Cấu hình trong android/app/build.gradle

Thêm vào phần `android`:

```gradle
signingConfigs {
    release {
        storeFile file('my-release-key.keystore')
        storePassword 'YOUR_PASSWORD'
        keyAlias 'my-key-alias'
        keyPassword 'YOUR_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... các config khác
    }
}
```

#### Build với signing

```bash
cd android
./gradlew assembleRelease
# hoặc
./gradlew bundleRelease
```

## 📝 Lưu ý quan trọng

### Cho iOS:

1. **Apple Developer Account**: Cần tài khoản Apple Developer ($99/năm) để:
   - Build app cho thiết bị thật
   - Submit lên App Store
   
2. **Certificate & Provisioning Profile**: Phải được cấu hình đúng trong Xcode

3. **Testing**: 
   - Simulator: Free, không cần tài khoản
   - Thiết bị thật: Cần Apple Developer account

### Cho Android:

1. **Keystore**: Giữ keystore file và password AN TOÀN. Mất keystore = không thể update app trên Play Store

2. **APK vs AAB**:
   - APK: Cài đặt trực tiếp, dùng để test
   - AAB: Upload lên Google Play Store (bắt buộc từ 2021)

3. **Testing**: Có thể test trên emulator hoặc thiết bị thật miễn phí

## 🔧 Troubleshooting

### iOS Build Errors

```bash
# Xóa cache và rebuild
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Errors

```bash
# Xóa cache
cd android
./gradlew clean
cd ..
```

### Expo Build Issues

```bash
# Clear Expo cache
expo start -c
```

## 📚 Tài liệu tham khảo

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [Publishing to App Store](https://docs.expo.dev/submit/ios/)
- [Publishing to Google Play](https://docs.expo.dev/submit/android/)

## 🎉 Hoàn thành!

Bây giờ bạn đã có thể build và phân phối ứng dụng Loto của mình!

---

**Lưu ý**: Nếu bạn là người mới bắt đầu, hãy sử dụng EAS Build. Đây là cách dễ nhất và được Expo hỗ trợ đầy đủ.
