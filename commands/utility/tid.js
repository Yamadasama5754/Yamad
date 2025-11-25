class ThreadID {
  constructor() {
    this.name = "تيد";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "عرض معرف المجموعة";
    this.role = 0;
    this.aliases = ["تيد", "threadid", "ايدي_المجموعة"];
  }

  async execute({ api, event }) {
    return api.sendMessage(
      event.threadID.toString(),
      event.threadID
    );
  }
}

export default new ThreadID();
