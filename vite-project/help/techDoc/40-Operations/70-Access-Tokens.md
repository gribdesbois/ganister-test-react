# Access Tokens
Whenever a user logs in Ganister PLM, a token is sent back to the client. For future request, this token is requested to authenticate the request. This token has an expiration. It is by default set to :

    7200000 milliseconds = 2 hours

There is no renewal mechanism on the server side. If you are not using the Ganister PLM client (web front application) you will have to login again to get a new token after expiration time is reached. Our client application has a mechanism which automatically request a new token if the user is still active after 50% of the expiration time. 

## Configuration

In order to change the token expiration delay, you need to change the following settings in the .env file.

    # JWT DURATION 7200000 = 2h
    JWT_EXPIRATION = 7200000

- JWT_EXPIRATION = Token expiration delay in milliseconds
