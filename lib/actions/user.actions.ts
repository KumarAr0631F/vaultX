"use server";

import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "../appwrite";
import { ID } from "node-appwrite";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const signIn = async ({email, password}: signInProps) => {
  try {
    // First check if there's already an active session
    const { account } = await createSessionClient();
    
    try {
      // Try to get current user - if successful, user is already logged in
      const currentUser = await account.get();
      if (currentUser) {
        return parseStringify(currentUser);
      }
    } catch (sessionError) {
      // No active session, proceed with login
    }
    
    // Create new session
    const response = await account.createEmailPasswordSession(email, password);
    
    // Set the session cookie
    (await cookies()).set("appwrite-session", response.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    
    return parseStringify(response);
  } catch (error: any) {
    console.error("Error during sign-in:", error);
    
    // Re-throw the error so it can be handled by the frontend
    throw {
      code: error.code || 500,
      type: error.type || 'unknown_error',
      message: error.message || 'An error occurred during sign-in'
    };
  }
};

export const signUp = async ({password, ...userData}: SignUpParams) => {
    const {email, firstName, lastName} = userData;

    // Validate required environment variables
    if (!process.env.DWOLLA_KEY || !process.env.DWOLLA_SECRET || !process.env.DWOLLA_ENV) {
      throw new Error("Missing required Dwolla environment variables. Please check DWOLLA_KEY, DWOLLA_SECRET, and DWOLLA_ENV");
    }

    let newUserAccount;

  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);

    if(!newUserAccount){
      throw new Error("Error creating user account");
    }

    console.log("User account created successfully, now creating Dwolla customer...");
    
    // Validate and clean the data before sending to Dwolla
    const dwollaData = {
      firstName: userData.firstName?.trim(),
      lastName: userData.lastName?.trim(),
      email: userData.email?.trim().toLowerCase(),
      address1: userData.address1?.trim(),
      city: userData.city?.trim(),
      state: userData.state?.trim().toUpperCase(), // Ensure state is uppercase
      postalCode: userData.postalcode?.trim(), // AuthForm sends 'postalcode' not 'postalCode'
      dateOfBirth: userData.dateOfBirth?.trim(),
      ssn: userData.ssn?.trim(),
      type: "personal" as const
    };

    console.log("Dwolla customer data:", {
      ...dwollaData,
      ssn: dwollaData.ssn ? "***PROVIDED***" : "MISSING"
    });

    console.log("State value details:", {
      original: userData.state,
      trimmed: userData.state?.trim(),
      uppercase: userData.state?.trim().toUpperCase(),
      finalValue: dwollaData.state,
      length: dwollaData.state?.length
    });

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address1', 'city', 'state', 'postalCode', 'dateOfBirth', 'ssn'];
    const missingFields = requiredFields.filter(field => !dwollaData[field as keyof typeof dwollaData]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for Dwolla: ${missingFields.join(', ')}`);
    }

    // Validate state format (must be 2 characters)
    if (dwollaData.state && dwollaData.state.length !== 2) {
      throw new Error(`State must be exactly 2 characters, got: ${dwollaData.state}`);
    }

    // Validate state is a valid US state abbreviation
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      'DC' // District of Columbia
    ];
    
    if (dwollaData.state && !validStates.includes(dwollaData.state)) {
      throw new Error(`Invalid state abbreviation: ${dwollaData.state}. Must be a valid US state abbreviation (e.g., CA, NY, TX).`);
    }

    // Validate date format (YYYY-MM-DD)
    if (dwollaData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dwollaData.dateOfBirth)) {
      throw new Error(`Date of birth must be in YYYY-MM-DD format, got: ${dwollaData.dateOfBirth}`);
    }

    const dwollaCustomerUrl = await createDwollaCustomer(dwollaData);

    if(!dwollaCustomerUrl) {
      throw new Error("Failed to create Dwolla customer - URL is undefined");
    }

    console.log("Dwolla customer created successfully:", dwollaCustomerUrl);

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        address1: userData.address1,
        city: userData.city,
        state: userData.state,
        postalCode: userData.postalcode, // Convert postalcode to postalCode for Appwrite
        dateOfBirth: userData.dateOfBirth,
        ssn: userData.ssn,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }
    )

    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUserAccount);
  } catch (error: any) {
    console.error("Error during sign-up:", error);
    
    // Re-throw the error so it can be handled by the frontend
    throw {
      code: error.code || 500,
      type: error.type || 'unknown_error',
      message: error.message || 'An error occurred during sign-up'
    };
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}

export const logoutAccount = async () => {
  try{
    const {account} = await createSessionClient();

    (await cookies()).delete("appwrite-session");

    await account.deleteSession('current');
  }
  catch(error){
    return null;
  }
}

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "VaultX User",
      products: ['auth'] as Products[],
      language: 'en',
      country_codes: ["US"] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);
    return parseStringify({ linkToken: response.data.link_token });
  }
  catch (error: any) {
    console.error("Error creating link token:", error);
    throw new Error(`Failed to create link token: ${error.message || error}`);
  }
}

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        sharableId,
      },
      
    )

    return parseStringify(bankAccount);

  } catch (error) {
    console.error("Error creating bank account:", error);
    
  }
}

export const exchangePublicToken = async ({ publicToken, user }: exchangePublicTokenProps) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });


    const accountData = accountResponse.data.accounts[0];

    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    })

    if(!fundingSourceUrl) {
      throw Error("Failed to add funding source");
    }

    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      sharableId: encryptId(accountData.account_id),
    })

    revalidatePath('/');

    return parseStringify({
      message: "Bank account linked successfully",
    });
  }
  catch (error) {
    console.log(error)
  }
}