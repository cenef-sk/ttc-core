const {resetPasswordToken, checkResetPasswordToken} = require('./userServices');

describe('userServices are able to', () => {
  test('generate reset password token and check its validity', () => {
    let passHash = "hash"
    let email = "some@email.com"
    token = resetPasswordToken(email, passHash)
    expect(checkResetPasswordToken(token)).toStrictEqual({
      email: "some@email.com"
    });
    // expect()
  })
})
