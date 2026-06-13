export interface PaystackInitializationResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}
export interface PaystackInitializationPayload {
  amount: number;
  email: string;
  reference: string;
  metadata?:object
}



export interface PaystackVerificationResponse {
   status: string;
 amount: number;
  paid_at: string;
  currency: string;
  customer:{email: string};
}