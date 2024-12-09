declare module 'jsonwebtoken' {
    interface JwtPayload {
        userId: any,
        exp: any
    }
    function verify(token, secret)
    function sign(prop1, prop2, prop3)
}

