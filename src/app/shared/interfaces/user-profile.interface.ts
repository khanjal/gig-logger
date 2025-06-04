export interface UserProfile {
  sub: string;           // Subject - Unique identifier for the user
  name?: string;         // Full name
  given_name?: string;   // First name
  family_name?: string;  // Last name
  email?: string;        // Email address
  picture?: string;      // Profile picture URL
  locale?: string;       // User's locale
}
