import 'dotenv/config';
if (process.env.ADMIN_TOKEN)
  console.log(
    `Your private studio access key:\n${process.env.ADMIN_TOKEN}\n\nKeep this key private. It grants catalogue editing access.`,
  );
else {
  console.error('Run npm run setup first.');
  process.exitCode = 1;
}
