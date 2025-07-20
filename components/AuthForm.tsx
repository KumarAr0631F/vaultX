"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getLoggedInUser, signIn, signUp } from "@/lib/actions/user.actions";

const formSchema = (type: string) =>
  z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName:
      type === "sign-in"
        ? z.string().optional()
        : z.string().min(3, "First name is required"),
    lastName:
      type === "sign-in"
        ? z.string().optional()
        : z.string().min(3, "Last name is required"),
    address1: type === "sign-in" ? z.string().optional() : z.string().max(50),
    city: type === "sign-in" ? z.string().optional() : z.string().max(20),
    state:
      type === "sign-in" ? z.string().optional() : z.string().min(2).max(2),
    postalcode:
      type === "sign-in" ? z.string().optional() : z.string().min(3).max(6),
    dateOfBirth:
      type === "sign-in"
        ? z.string().optional()
        : z.string().min(3, "Date of birth is required"),
    ssn:
      type === "sign-in"
        ? z.string().optional()
        : z.string().min(3, "SSN is required"),
  });

const AuthForm = ({ type }: { type: string }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const FormSchema = formSchema(type);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      address1: "",
      city: "",
      state: "",
      postalcode: "",
      dateOfBirth: "",
      ssn: "",
    },
  });
  

  const onsubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try{
      
      if(type === "sign-up"){
        const newUser = await signUp(data);
        setUser(newUser);
      }
      if(type === "sign-in"){
        // Check if user is already logged in
        const existingUser = await getLoggedInUser();
        if(existingUser) {
          // User is already logged in, redirect to home
          router.push("/");
          return;
        }
        
        const response = await signIn({
          email: data.email,
          password: data.password,
        })
        if(response) router.push("/");
      }
    }
    catch (error: any){
      console.log(error)
      
      // Handle specific error types
      if (error.code === 429 || error.type === 'general_rate_limit_exceeded') {
        alert('Too many sign-in attempts. Please wait a few minutes and try again.');
      } else if (error.code === 401 && error.type === 'user_session_already_exists') {
        alert('You are already signed in. Redirecting to home...');
        router.push("/");
      } else if (error.code === 401) {
        alert('Invalid email or password. Please check your credentials.');
      } else {
        alert('An error occurred during authentication. Please try again.');
      }
    }
    finally{
      setIsLoading(false);
    }
  }

  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href={"/"} className="cursor-pointer flex items-center gap-1">
          <Image
            src="/icons/logo.svg"
            className="mt-5"
            width={34}
            height={34}
            alt="Logo"
          />
          <h1 className="mt-5 text-26 font-ibm-plex-serif font-bold text-black-1">
            vaultX
          </h1>
        </Link>

        <div className="flex flex-col gap-1 md:gap-3"></div>
        <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
          {user ? "Link Account" : type === "sign-in" ? "Sign In" : "Sign Up"}

          <p className="text-16 font-normal text-gray-600 ">
            {user
              ? "Link your Account to get started"
              : "Please enter your details"}
          </p>
        </h1>
      </header>

      {user ? (
        <div className="flex flex-col gap-4">{/* plaid link */}</div>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onsubmit)} className="space-y-8">
              {type === "sign-up" && (
                <>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <div className="form-item w-full">
                          <FormLabel className="form-label">First Name</FormLabel>
                          <div className="flex flex-col w-full">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Ex: John"
                                className="input-class"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="form-message mt-2" />
                          </div>
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <div className="form-item w-full">
                          <FormLabel className="form-label">Last Name</FormLabel>
                          <div className="flex flex-col w-full">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Ex: Doe"
                                className="input-class"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="form-message mt-2" />
                          </div>
                        </div>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <div className="form-item">
                        <FormLabel className="form-label">Address</FormLabel>
                        <div className="flex flex-col w-full">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter your specific address"
                              className="input-class"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="form-message mt-2" />
                        </div>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <div className="form-item">
                        <FormLabel className="form-label">City</FormLabel>
                        <div className="flex flex-col w-full">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter your city"
                              className="input-class"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="form-message mt-2" />
                        </div>
                      </div>
                    )}
                  />

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <div className="form-item w-full">
                          <FormLabel className="form-label">State</FormLabel>
                          <div className="flex flex-col w-full">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Ex: NY"
                                className="input-class"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="form-message mt-2" />
                          </div>
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalcode"
                      render={({ field }) => (
                        <div className="form-item w-full">
                          <FormLabel className="form-label">Postal Code</FormLabel>
                          <div className="flex flex-col w-full">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Ex: 11101"
                                className="input-class"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="form-message mt-2" />
                          </div>
                        </div>
                      )}
                    />
                  </div>

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <div className="form-item w-full">
                          <FormLabel className="form-label">Date of Birth</FormLabel>
                          <div className="flex flex-col w-full">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="yyyy-mm-dd"
                                className="input-class"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="form-message mt-2" />
                          </div>
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ssn"
                      render={({ field }) => (
                        <div className="form-item w-full">
                          <FormLabel className="form-label">SSN</FormLabel>
                          <div className="flex flex-col w-full">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Ex: 1234"
                                className="input-class"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="form-message mt-2" />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <div className="form-item">
                    <FormLabel className="form-label">Email</FormLabel>
                    <div className="flex flex-col w-full">
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          className="input-class"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="form-message mt-2" />
                    </div>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <div className="form-item">
                    <FormLabel className="form-label">Password</FormLabel>
                    <div className="flex flex-col w-full">
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          className="input-class"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="form-message mt-2" />
                    </div>
                  </div>
                )}
              />
              <div className="flex flex-col gap-4">
                <Button type="submit" disabled={isLoading} className="form-btn">
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> &nbsp;
                      Loading...
                    </>
                  ) : type === "sign-in" ? (
                    "Sign In"
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <footer className="flex justify-center gap-1">
            <p className="text-14 font-normal text-gray-600">
              {type === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>

            <Link
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}
              className="form-link"
            >
              {type === "sign-in" ? "Sign up" : "Sign in"}
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};

export default AuthForm;
