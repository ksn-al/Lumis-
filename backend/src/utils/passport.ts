import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma';
const logger = require('./logger');

export function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          'http://localhost:5000/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google did not return an email'));

          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (user) {
            
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, isVerified: true },
              });
            }
            return done(null, user);
          }

          const base = (profile.displayName || email.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .slice(0, 28);

          let username = base;
          const taken = await prisma.user.findUnique({ where: { username } });
          if (taken) username = `${base}_${Date.now().toString(36)}`;

          const googleAvatar = profile.photos?.[0]?.value ?? null;

          user = await prisma.user.create({
            data: {
              email,
              username,
              displayname: profile.displayName || username,
              googleId:    profile.id,
              avatar:      googleAvatar,
              isVerified:  true,  
            },
          });

          done(null, user);
        } catch (err) {
          logger.error('Google OAuth strategy error:', err);
          done(err as Error);
        }
      }
    )
  );
}
