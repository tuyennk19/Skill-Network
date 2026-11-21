const env = require('./src/config/env');
const app = require('./src/app');

app.listen(env.PORT, () => {
  console.log(`Skill_Network server listening on port ${env.PORT}`);
});
