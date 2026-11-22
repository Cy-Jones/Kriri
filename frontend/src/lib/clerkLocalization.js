let currentListener = null;

export const authLocalization = {
  formFieldInputPlaceholder__firstName: " ",
  formFieldInputPlaceholder__lastName: " ",
  formFieldInputPlaceholder__username: " ",
  formFieldInputPlaceholder__emailAddress_username: " ",
  formFieldInputPlaceholder__password: " ",
  formFieldInputPlaceholder__signUpPassword: " ",
  formFieldInputPlaceholder__newPassword: " ",
  formFieldInputPlaceholder__currentPassword: " ",
  formFieldInputPlaceholder__confirmPassword: " ",
  formFieldInputPlaceholder__emailAddress: " ",
  formFieldInputPlaceholder__emailAddresses: " ",
  formFieldInputPlaceholder__phoneNumber: " ",
};

export const defaultLocalization = {
  ...authLocalization,
  organizationProfile: {
    profilePage: {
      dangerSection: {
        leaveOrganization: {
          title: "Leave workspace",
          messageLine1:
            "Notice: If you are an Owner & Administrator, you cannot leave without transferring ownership to a team member.",
          messageLine2:
            "Leaving will immediately revoke your management privileges and workspace access.",
        },
      },
    },
  },
};

export function subscribeClerkLocalization(listener) {
  currentListener = listener;
  return () => {
    currentListener = null;
  };
}

export function updateClerkLocalization(localization) {
  if (currentListener) {
    currentListener(localization);
  }
}

