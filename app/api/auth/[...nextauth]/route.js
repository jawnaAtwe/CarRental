import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import argon2 from "argon2";
import { dbConnection } from '../../v1/functions/db';

const messages = {
  en: {
    USER_NOT_FOUND: "User not found",
    ACCOUNT_NOT_ACTIVE: "Account not active",
    INVALID_PASSWORD: "Invalid password",
    UNKNOWN_ERROR: "An unknown error occurred",
    INVALID_TYPE: "Invalid login type"
  },
  ar: {
    USER_NOT_FOUND: "المستخدم غير موجود",
    ACCOUNT_NOT_ACTIVE: "الحساب غير مفعل",
    INVALID_PASSWORD: "كلمة المرور غير صحيحة",
    UNKNOWN_ERROR: "حدث خطأ غير معروف",
    INVALID_TYPE: "نوع تسجيل الدخول غير صالح"
  }
};
//
function getMessage(key, lang = "en") {
  return messages[lang]?.[key] || messages["en"][key] || messages["en"].UNKNOWN_ERROR;
}

const db = async () => {
  return dbConnection();
};

// Get user by email from the new schema
async function getUserByEmail(email) {
  const pool = await db();
  const [rows] = await pool.query(
    `SELECT u.*, r.slug AS role_slug, r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0];
}
// Get customer by email
async function getCustomerByEmail(email) {
  const pool = await db();
  const [rows] = await pool.query(
    `SELECT *
     FROM customers
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0];
}
// Get roles for user
async function getUserRoles(user_id) {
  const pool = await db();
  const [rows] = await pool.query(
    `SELECT r.slug
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [user_id]
  );
  return rows.map(r => r.slug).filter(Boolean);
}
function getCustomerPermissions() {
  return [
    "view_profile",
    "edit_profile",
    "book_car",
  ];
}
// Get permissions for user
async function getUserPermissions(user_id) {
  const pool = await db();
  const [rows] = await pool.query(
    `SELECT DISTINCT p.code
     FROM users u
     JOIN role_permissions rp ON u.role_id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE u.id = ?`,
    [user_id]
  );
  return rows.map(p => p.code);
}

const authOptions = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        lang: { label: "Language", type: "text", placeholder: "en" },
      },
      async authorize(credentials) {
  const lang = credentials?.lang || "en";

  try {
    if (!credentials?.email || !credentials?.password) {
      throw new Error(getMessage("INVALID_TYPE", lang));
    }

    const email = credentials.email.trim().toLowerCase();

    // ======================
    // 1️⃣ TRY USER
    // ======================
    const user = await getUserByEmail(email);

    if (user) {
      if (user.status !== "active")
        throw new Error(getMessage("ACCOUNT_NOT_ACTIVE", lang));

      const valid = await argon2.verify(
        user.password_hash,
        credentials.password
      );

      if (!valid)
        throw new Error(getMessage("INVALID_PASSWORD", lang));

      const roles = await getUserRoles(user.id);
      const permissions = await getUserPermissions(user.id);

      return {
        id: user.id,
        email: user.email,
        name: user.full_name || user.email,
        avatar: null,
        roles,
        permissions,
        tenantId: user.tenant_id,
        roleId: user.role_id,
        type: "user",
      };
    }

    // ======================
    // 2️⃣ TRY CUSTOMER
    // ======================
    const customer = await getCustomerByEmail(email);

    if (!customer)
      throw new Error(getMessage("USER_NOT_FOUND", lang));

    if (customer.status !== "active")
      throw new Error(getMessage("ACCOUNT_NOT_ACTIVE", lang));

    const validCustomer = await argon2.verify(
      customer.hashed_password,
      credentials.password
    );

    if (!validCustomer)
      throw new Error(getMessage("INVALID_PASSWORD", lang));

    return {
      id: customer.id,
      email: customer.email,
      name: customer.full_name || customer.email,
      avatar: null,
      roles: ["customer_role"],
      permissions: getCustomerPermissions(),
      tenantId: customer.tenant_id ?? null,
      roleId: null,
      type: "customer",
    };
  } catch (err) {
    console.error("auth error", err);
    throw new Error(err.message || getMessage("UNKNOWN_ERROR", lang));
  }
}

    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // If logging in, set all user info
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatar = user.avatar;
        token.type = user.type;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.tenantId = user.tenantId;
        token.roleId = user.roleId;

    } else if (token.id && token.type === "user") {
  token.roles = await getUserRoles(token.id);
  token.permissions = await getUserPermissions(token.id);
}

      return token;
    },
    async session({ session, token }) {
      // Always update session with latest permissions and roles
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          avatar: token.avatar,
          roles: token.roles,
          permissions: token.permissions,
          type: token.type,
          tenantId: token.tenantId,
          roleId: token.roleId,
          
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };