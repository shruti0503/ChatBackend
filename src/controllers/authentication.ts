import express from 'express';
import { createUser, getUserByEmail, getUserUsername, updateUserById } from '../db/users';
import { authentication, random } from '../helpers';
import { DOMAIN, SESSION_TOKEN } from '../constants';

export const register = async (req: express.Request, res: express.Response) => {
    try {
        const { username, email, password } = req.body;
        console.log("username, email, password",username, email, password)

        if (!username || !email || !password) {
            return res.sendStatus(400);
        }
        console.log("wjnefj")

        const result = await getUserByEmail(email);

        if (!result || result.length > 0) {
            return res.sendStatus(400);
        }

        const salt = random();
        const user = await createUser({
            username,
            email,
            salt,
            password: authentication(salt, password),
        });

        return res.status(200).json(user).end();
    } catch (e) {
        console.log(e);
        return res.sendStatus(400);
    }
};

export const login = async (req: express.Request, res: express.Response) => {
 
    try {
      const { username, password } = req.body;
      console.log("tyoe of pass", typeof password)
      console.log("username, password",username, password)
  
      // if (!username || !password) {
      //   return res.status(400).send('Username and password are required');
      // }
      console.log("tyoe of pass", typeof password)
  
      const result = await getUserUsername(username);
      console.log("result",result)
  
      if (!result || result.length === 0) {
        return res.status(400).send('User not found');
      }
  
      const user = result[0];
      console.log("user",user)
  
      const expectedHash = authentication(user.salt, password);
  
      if (user.password !== expectedHash) {
        return res.status(403).send('Invalid credentials');
      }
  
      user.sessiontoken = authentication(random(), user.password);
  
      const updatedUser = await updateUserById(user.id, user);
      console.log("updatedUser",updatedUser)
      console.log("updatedUser",user.sessiontoken)
  
      res.cookie(SESSION_TOKEN, user.sessiontoken, {
        domain: DOMAIN,
        path: '/',
        httpOnly: true, // Prevent client-side access to the cookie
        secure: false, // Ensure the cookie is only sent over HTTPS
        expires: new Date(Date.now() + 900000), // Session expires in 15 minutes
      });
  
      return res.status(200).json({
        updatedUser
        // id: updatedUser.id,
        // username: updatedUser.username,
        // token: user.sessiontoken,
      }).end();
    } catch (e) {
      console.log(e);
      return res.status(400).send('An error occurred');
    }
  };