https://discord.com/channels/1273395237720555672/1273415914976710656/1287507847185174590

I need to also add some random value to the api endpoint that I send a GET request to. That way it'll think its a different thing, ig 


basically uhh:
- no cache is your friend, use it in api responses
this means "use stale data but you better ask the server for new one too"

try to do everything on the server, the more client components there are, the worse it is.


-------------

my changes still didnt change anything, lol.

-------------

Quinten said this:

> The individual pages have no reason or need to be indexed, you should switch to SSG base and CSR everything else, as soon as you do any external data fetching the speed diff is irrelevant


