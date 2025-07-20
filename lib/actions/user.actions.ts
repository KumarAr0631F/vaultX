"use server";

import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "../appwrite";
import { ID } from "node-appwrite";
import { parseStringify } from "../utils";

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

export const signUp = async (userData: SignUpParams) => {
    const {email, password, firstName, lastName} = userData;
  try {
    const { account } = await createAdminClient();

    const newUserAccount = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);
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