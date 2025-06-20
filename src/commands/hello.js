module.exports = {
  name: 'hello',
  description: 'Menyapa user',
  execute: async ({ message, client }) => {
    console.log('Eksekusi command:', this.name);
    await client.sendMessage(message.from, { text: 'Halo, ini Clovbot!' });
  }
};
