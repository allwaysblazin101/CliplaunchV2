import { BadRequestException, Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import { randomUUID } from 'crypto';

const secure = process.env.COOKIE_SECURE === '1'; // set to 1 in prod behind HTTPS
const cookieOpts = {
  httpOnly: true,
  sameSite: secure ? ('none' as const) : ('lax' as const),
  secure,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  @Get('nonce')
  nonce(@Res({ passthrough: true }) res: Response) {
    const nonce = randomUUID();
    res.cookie('nonce', nonce, { ...cookieOpts, maxAge: 5 * 60 * 1000 });
    return { nonce };
  }

  @Post('verify')
  async verify(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const { address, message, signature } = body ?? {};
    if (!address || !message || !Array.isArray(signature)) {
      throw new BadRequestException('Missing fields: address, message, signature[]');
    }

    const nonce = res.req.cookies?.nonce;
    if (!nonce) throw new BadRequestException('Missing nonce cookie');

    const expected = `Cliplaunch:${address}:${nonce}`;
    if (message !== expected) throw new BadRequestException('Message/nonce mismatch');

    const msg = new TextEncoder().encode(message);
    const sig = new Uint8Array(signature);
    const pub = new PublicKey(address).toBytes();
    const ok = nacl.sign.detached.verify(msg, sig, pub);
    if (!ok) throw new BadRequestException('Invalid signature');

    const token = this.jwt.sign({ sub: address }, { secret: process.env.JWT_SECRET || 'dev_secret', expiresIn: '7d' });
    res.cookie('token', token, { ...cookieOpts, maxAge: 7 * 24 * 3600 * 1000 });
    return { success: true };
  }

  @Get('me')
  me(@Res({ passthrough: false }) res: Response) {
    // auth is optional here; front-end just probes cookie presence via /auth/me?jwt=1 would be better,
    // but simplest is to return 200 if token cookie exists.
    const has = !!(res.req as any).cookies?.token;
    res.status(200).json({ authed: has });
  }
}
