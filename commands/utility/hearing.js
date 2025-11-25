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

class ListenCommand {
  constructor() {
    this.name = "سماع";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 15;
    this.description = "استمع لتسجيل صوتي للسورة المحددة";
    this.role = 0;
    this.aliases = ["سماع", "تسجيل"];
  }

  async getSurahNumber(surahName) {
    const name = surahName.trim().replace(/سورة\s+/i, "");
    return surahNames[name] || null;
  }

  async getAudio(surahNum) {
    try {
      // جلب بيانات السورة مع الصوت من AlQuran Cloud API
      const response = await axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/ar.alafasy`, { timeout: 10000 });
      const data = response.data.data;
      
      // جلب أول آية والحصول على رابط الصوت
      if (data.ayahs && data.ayahs.length > 0 && data.ayahs[0].audio) {
        // رابط الصوت من AlQuran Cloud مع الشيخ مشاري العفاسي
        return { surah: data.name, audio: data.ayahs[0].audio };
      }
      
      throw new Error("لا توجد روابط صوتية متاحة");
    } catch (error) {
      console.error("خطأ في جلب الأوديو:", error.message);
      return null;
    }
  }

  parseInput(text) {
    const regex = /سورة[\s]+([^\s\d]+)/i;
    const match = text.match(regex);
    
    if (!match) return null;
    
    return {
      surah: match[1].trim()
    };
  }

  async execute({ api, event, args }) {
    const input = args.join(" ");
    const parsed = this.parseInput(input);

    if (!parsed) {
      api.sendMessage("❌ | الاستخدام الصحيح:\n.سماع سورة الكهف", event.threadID, event.messageID);
      return;
    }

    const sentMsg = await api.sendMessage("⏱️ | جاري تحميل الأوديو....", event.threadID);

    try {
      const surahNum = await this.getSurahNumber(parsed.surah);
      if (!surahNum) {
        api.sendMessage("❌ | لم أجد هذه السورة!", event.threadID, event.messageID);
        api.unsendMessage(sentMsg.messageID);
        return;
      }

      const audioData = await this.getAudio(surahNum);
      if (!audioData || !audioData.audio) {
        api.sendMessage("❌ | خطأ في جلب الأوديو!", event.threadID, event.messageID);
        api.unsendMessage(sentMsg.messageID);
        return;
      }

      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempAudioPath = path.join(tempDir, `${audioData.surah}_${Date.now()}.mp3`);
      const audioResponse = await axios.get(audioData.audio, { responseType: "stream", timeout: 60000 });
      const writeStream = fs.createWriteStream(tempAudioPath);
      audioResponse.data.pipe(writeStream);

      writeStream.on("finish", async () => {
        try {
          api.sendMessage({
            body: `《 ${audioData.surah} 》\n\n{وَإِذَا قَرَأَ الْقُرْآنَ فَاسْتَمِعُوا لَهُ وَأَنْصِتُوا}`,
            attachment: fs.createReadStream(tempAudioPath)
          }, event.threadID, (err) => {
            if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
            api.unsendMessage(sentMsg.messageID);
          });
        } catch (err) {
          console.error("خطأ في الإرسال:", err);
          api.sendMessage("❌ | حدث خطأ في إرسال الصوت!", event.threadID, event.messageID);
          if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
          api.unsendMessage(sentMsg.messageID);
        }
      });

      writeStream.on("error", (error) => {
        console.error("خطأ في تحميل الأوديو:", error);
        api.sendMessage("❌ | حدث خطأ أثناء تحميل الأوديو!", event.threadID, event.messageID);
        api.unsendMessage(sentMsg.messageID);
      });
    } catch (error) {
      console.error("خطأ:", error);
      api.sendMessage("❌ | حدث خطأ!", event.threadID, event.messageID);
      api.unsendMessage(sentMsg.messageID);
    }
  }
}

export default new ListenCommand();
