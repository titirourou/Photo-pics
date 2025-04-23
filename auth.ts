import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const adminEmails = [
  process.env.ADMIN_EMAIL || 'trousseau@chalktalksports.com'
];

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
  },
  callbacks: {
    async signIn({ user }) {
      // Only allow @chalktalksports.com emails
      return user.email?.endsWith('@chalktalksports.com') ?? false;
    },
    async jwt({ token }) {
      if (token.email) {
        token.isAdmin = adminEmails.includes(token.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
});

export { handler as GET, handler as POST }; 