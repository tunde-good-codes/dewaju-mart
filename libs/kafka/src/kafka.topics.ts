export const KAFKA_CLIENT_ID = "dewaju-mart-api";
export const KAFKA_BROKER = process.env.KAFKA_BROKER;
export const KAFKA_CONSUMER_GROUP = "dewaju-mart-consumer-api";

export const KAFKA_TOPICS = {
  USER_CREATED: "user.created",
  GOOGLE_USER_CREATED: "google-user-created",
  REGISTER_USER_OTP: "register-user-otp",
  FORGOT_PASSWORD_OTP: "forgot-password-otp",
  VERIFY_EMAIL_OTP: "verify_email-otp",
  UPLOAD_SINGLE_USER_IMAGE: "upload-single-user-image",
  UPLOAD_MULTIPLE_PRODUCT_IMAGE: "upload-multiple-product-images",
  MEDIA_DELETE:"media_delete"
};
