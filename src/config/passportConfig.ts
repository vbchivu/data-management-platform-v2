import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import User, { IUser } from '../app/models/User';
import dotenv from 'dotenv';

dotenv.config();

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'default_secret_key',
};

passport.use(
    new JwtStrategy(options, async (jwtPayload: { id: any; }, done: (arg0: unknown, arg1: boolean | IUser) => any) => {
        try {
            const user: IUser | null = await User.findById(jwtPayload.id);
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err, false);
        }
    })
);

export default passport;
