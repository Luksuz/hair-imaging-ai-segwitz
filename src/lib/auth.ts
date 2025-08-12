export function isValidCredentials(username: string, password: string) {
  return (
    username === process.env.NEXT_PUBLIC_ADMIN_USERNAME ||
    (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD)
  );
}




