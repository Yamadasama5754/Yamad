import axios from "axios";
import fs from "fs-extra";
import path from "path";

const surahNames = {
  الفاتحة: 1, البقرة: 2, آلعمران: 3, النساء: 4, المائدة: 5, الأنعام: 6, الأعراف: 7, الأنفال: 8, التوبة: 9, يونس: 10,
  هود: 11, يوسف: 12, الرعد: 13, إبراهيم: 14, الحجر: 15, النحل: 16, الإسراء: 17, الكهف: 18, مريم: 19, طه: 20,
  الأنبياء: 21, الحج: 22, المؤمنون: 23, النور: 24, الفرقان: 25, الشعراء: 26, النمل: 27, القصص: 28, العنكبوت: 29, الروم: 30,
  لقمان: 31, السجدة: 32, الأحزاب: 33, سبأ: 34, فاطر: 35, يس: 36, الصافات: 37, ص: 38, الزمر: 39, غافر: 40,
  فصلت: 41, الشورى: 42, الزخرف: 43, الدخان: 44, الجاثية: 45, الأحقاف: 46, محمد: 47, الفتح: 48, الحجرات: 49, ق: 50,
  الذاريات: 51, الطور: 52, النجم: 53, القمر: 54, الرحمن: 55, الواقعة: 56, الحديد: 57, المجادلة: 58, الحشر: 59, الممتحنة: 60,
  الصف: 61, الجمعة: 62, المنافقون: 63, التغابن: 64, الطلاق: 65, التحريم: 66, الملك: 67, القلم: 68, الحاقة: 69, المعارج: 70,
  نوح: 71, الجن: 72, المزمل: 73, المدثر: 74, القيامة: 75, الإنسان: 76, المرسلات: 77, النبأ: 78, النازعات: 79, عبس: 80,
  التكوير: 81, الانفطار: 82, المطففين: 83, الانشقاق: 84, البروج: 85, الطارق: 86, الأعلى: 87, الغاشية: 88, الفجر: 89, البلد: 90,
  الشمس: 91, الليل: 92, الضحى: 93, الشرح: 94, التين: 95, العلق: 96, القدر: 97, البينة: 98, الزلزلة: 99, العاديات: 100,
  القارعة: 101, التكاثر: 102, العصر: 103, الهمزة: 104, الفيل: 105, قريش: 106, الماعون: 107, الكوثر: 108, الكافرون: 109, النصر: 110, الإخلاص: 111, الفلق: 112, الناس: 113
};

class QuranCommand {
  constructor() {
    this.name = "قرآن";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 20;
    this.description = "قرآن سورة الفلق | قرآن سورة الكهف آية 5";
    this.role = 0;
    this.aliases = ["قرآن"];
  }

  async getSurahNumber(surahName) {
    const name = surahName.trim().replace(/سورة\s+/i, "");
    return surahNames[name] || null;
  }

  async getVerses(surahNum, verseNum = null) {
    try {
      const url = `https://api.alquran.cloud/v1/surah/${surahNum}`;
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data.data;
      
      if (verseNum) {
        const verse = data.ayahs.find(a => a.numberInSurah === verseNum);
        return verse ? { surah: data.name, verses: [verse], surahNum, totalVerses: data.numberOfAyahs } : null;
      }
      return { surah: data.name, verses: data.ayahs, surahNum, totalVerses: data.numberOfAyahs };
    } catch (error) {
      console.error("خطأ في جلب الآيات:", error);
      return null;
    }
  }

  async getVerseAudio(surahNum, verseNum) {
    try {
      const surahPadded = String(surahNum).padStart(3, '0');
      const versePadded = String(verseNum).padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/Alafasy_64kbps/${surahPadded}${versePadded}.mp3`;
      return audioUrl;
    } catch (error) {
      return null;
    }
  }

  async execute({ api, event, args }) {
    const input = args.join(" ").trim();
    
    if (!input) {
      return api.sendMessage(
        "❌ استخدام خاطئ!\n\n📝 الطرق الصحيحة:\n• قرآن سورة الفلق\n• قرآن سورة الكهف آية 5",
        event.threadID,
        event.messageID
      );
    }

    // تحديد ما إذا كان الطلب يتضمن رقم آية
    const verseMatch = input.match(/آية\s+(\d+)/);
    const verseNum = verseMatch ? parseInt(verseMatch[1]) : null;
    
    // استخراج اسم السورة
    const surahNameMatch = input.match(/سورة\s+([^\d]+?)(?:\s+آية|\s*$)/);
    if (!surahNameMatch) {
      return api.sendMessage(
        "❌ استخدام خاطئ!\n\n📝 الطرق الصحيحة:\n• قرآن سورة الفلق\n• قرآن سورة الكهف آية 5",
        event.threadID,
        event.messageID
      );
    }

    const surahName = surahNameMatch[1].trim();
    const surahNum = await this.getSurahNumber(surahName);

    if (!surahNum) {
      return api.sendMessage(
        "❌ لم أجد هذه السورة! تأكد من اسم السورة الصحيح.",
        event.threadID,
        event.messageID
      );
    }

    const sentMsg = await api.sendMessage("⏱️ جاري التحميل...", event.threadID);

    try {
      // إذا لم يحدد رقم آية، عرض خيارات الآيات
      if (!verseNum) {
        const data = await this.getVerses(surahNum);
        if (!data) {
          api.unsendMessage(sentMsg.messageID);
          return api.sendMessage("❌ خطأ في جلب بيانات السورة!", event.threadID);
        }

        const msg = `《 ${data.surah} 》\n📍 العدد: ${data.totalVerses} آية\n\n🎯 أرسل رقم الآية من 1 إلى ${data.totalVerses}`;
        
        api.sendMessage(msg, event.threadID, (err, info) => {
          if (!err) {
            global.client.handler.reply.set(info.messageID, {
              name: this.name,
              type: "verse_selection",
              surahNum: surahNum,
              surahName: data.surah,
              totalVerses: data.totalVerses,
              author: event.senderID
            });
          }
        });

        api.unsendMessage(sentMsg.messageID);
        return;
      }

      // إذا حدد آية، أرسل الأوديو
      const data = await this.getVerses(surahNum, verseNum);
      if (!data) {
        api.unsendMessage(sentMsg.messageID);
        return api.sendMessage("❌ هذه الآية غير موجودة!", event.threadID, event.messageID);
      }

      const verse = data.verses[0];
      const audioUrl = await this.getVerseAudio(surahNum, verseNum);

      if (!audioUrl) {
        api.unsendMessage(sentMsg.messageID);
        return api.sendMessage("❌ خطأ في جلب الأوديو!", event.threadID);
      }

      try {
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempAudioPath = path.join(tempDir, `quran_${surahNum}_${verseNum}_${Date.now()}.mp3`);
        const audioResponse = await axios.get(audioUrl, { responseType: "stream", timeout: 60000 });
        const writeStream = fs.createWriteStream(tempAudioPath);
        audioResponse.data.pipe(writeStream);

        writeStream.on("finish", async () => {
          await api.sendMessage({
            body: `《 ${data.surah} - الآية ${verseNum} 》\n\n${verse.text}\n\n{وَإِذَا قَرَأَ الْقُرْآنَ فَاسْتَمِعُوا لَهُ وَأَنْصِتُوا}`,
            attachment: fs.createReadStream(tempAudioPath)
          }, event.threadID, () => {
            if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
          });

          api.unsendMessage(sentMsg.messageID);
        });

        writeStream.on("error", (error) => {
          console.error("خطأ في تحميل الأوديو:", error);
          api.sendMessage("❌ حدث خطأ أثناء التحميل!", event.threadID);
          api.unsendMessage(sentMsg.messageID);
        });
      } catch (error) {
        console.error("خطأ:", error);
        api.sendMessage("❌ حدث خطأ!", event.threadID);
        api.unsendMessage(sentMsg.messageID);
      }
    } catch (error) {
      console.error("خطأ:", error);
      api.sendMessage("❌ حدث خطأ!", event.threadID);
      api.unsendMessage(sentMsg.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    if (!reply || reply.type !== "verse_selection") return;
    if (reply.author !== event.senderID) return;

    const userInput = event.body.trim();
    
    if (!/^\d+$/.test(userInput)) {
      return api.sendMessage("❌ أرسل رقم الآية فقط!", event.threadID, event.messageID);
    }

    const verseNum = parseInt(userInput);
    const { surahNum, surahName, totalVerses } = reply;

    if (verseNum < 1 || verseNum > totalVerses) {
      return api.sendMessage(`❌ رقم الآية يجب أن يكون من 1 إلى ${totalVerses}`, event.threadID, event.messageID);
    }

    const sentMsg = await api.sendMessage("⏱️ جاري التحميل...", event.threadID);

    try {
      const data = await this.getVerses(surahNum, verseNum);
      if (!data) {
        api.unsendMessage(sentMsg.messageID);
        return api.sendMessage("❌ خطأ في جلب الآية!", event.threadID);
      }

      const verse = data.verses[0];
      const audioUrl = await this.getVerseAudio(surahNum, verseNum);

      if (!audioUrl) {
        api.unsendMessage(sentMsg.messageID);
        return api.sendMessage("❌ خطأ في جلب الأوديو!", event.threadID);
      }

      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempAudioPath = path.join(tempDir, `quran_${surahNum}_${verseNum}_${Date.now()}.mp3`);
      const audioResponse = await axios.get(audioUrl, { responseType: "stream", timeout: 60000 });
      const writeStream = fs.createWriteStream(tempAudioPath);
      audioResponse.data.pipe(writeStream);

      writeStream.on("finish", async () => {
        await api.sendMessage({
          body: `《 ${surahName} - الآية ${verseNum} 》\n\n${verse.text}\n\n{وَإِذَا قَرَأَ الْقُرْآنَ فَاسْتَمِعُوا لَهُ وَأَنْصِتُوا}`,
          attachment: fs.createReadStream(tempAudioPath)
        }, event.threadID, () => {
          if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
        });

        api.unsendMessage(sentMsg.messageID);
      });

      writeStream.on("error", (error) => {
        console.error("خطأ في تحميل الأوديو:", error);
        api.sendMessage("❌ حدث خطأ أثناء التحميل!", event.threadID);
        api.unsendMessage(sentMsg.messageID);
      });
    } catch (error) {
      console.error("خطأ:", error);
      api.sendMessage("❌ حدث خطأ!", event.threadID);
      api.unsendMessage(sentMsg.messageID);
    }
  }
}

export default new QuranCommand();
