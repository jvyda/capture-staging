import { withAuthenticator } from "@aws-amplify/ui-react";
import { AuthUser } from "aws-amplify/auth";
import { redirect } from "next/navigation";
import React, { useEffect } from "react";

const SignUp = ({ user }: { user?: AuthUser }) => {
  useEffect(() => {
    if (user) {
      redirect("/");
    }
  });
  return null;
};
export default withAuthenticator(SignUp);
