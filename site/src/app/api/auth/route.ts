export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return Response.json(
      { error: "Admin password not configured" },
      { status: 500 }
    );
  }

  if (password === adminPassword) {
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Wrong password" }, { status: 401 });
}
