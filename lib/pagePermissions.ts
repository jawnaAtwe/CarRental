// Define required permissions for each page route
export const pagePermissions: {
  [route: string]: {
    permissions?: string[];
    roles?: string[];
    allowSuperAdmin?: boolean;
  };
} = {
 "/[firmId]/dashboard": {
  roles: ["super_admin", "user_admin"],
  permissions: [
    "access_admin_dashboard",
    "access_admin_user_dashboard",
  ],
  allowSuperAdmin: true,
},

  "/[firmId]/cases": {
    permissions: ["view_cases"],
    allowSuperAdmin: true,
  },
  "/[firmId]/settings": {
    roles: ["admin"],
    allowSuperAdmin: true,
  },
  // Dynamic firm dashboard route
 
  // Add more routes and their required permissions/roles here
};