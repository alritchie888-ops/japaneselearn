import { decomposeReading } from "./decompose"
import type { PracticalItem, PracticalModule } from "./types"

/**
 * Curated practical Japanese content. Each item declares its written form and
 * kana reading; its prerequisite kana are derived automatically from the
 * reading (see `itemRequiredKana`). Irregular readings are flagged so the gold
 * star system can surface them consistently across every category.
 */

type Seed = Omit<PracticalItem, "category">

function mod(
  id: string,
  category: PracticalModule["category"],
  title: string,
  jpTitle: string,
  blurb: string,
  seeds: Seed[],
  after?: string[],
): { module: PracticalModule; items: PracticalItem[] } {
  const items = seeds.map((s) => ({ ...s, category }))
  return {
    module: { id, category, title, jpTitle, blurb, itemIds: items.map((i) => i.id), after },
    items,
  }
}

const numbers1to10 = mod(
  "num-1-10",
  "numbers",
  "Numbers 1–10",
  "いち〜じゅう",
  "The foundation for everything else — count from one to ten.",
  [
    { id: "num-1", written: "1", kana: "いち", romaji: "ichi", meaning: "one", value: 1 },
    { id: "num-2", written: "2", kana: "に", romaji: "ni", meaning: "two", value: 2 },
    { id: "num-3", written: "3", kana: "さん", romaji: "san", meaning: "three", value: 3 },
    {
      id: "num-4",
      written: "4",
      kana: "よん",
      romaji: "yon",
      meaning: "four",
      value: 4,
      altReadings: [{ kana: "し", romaji: "shi", note: "used in dates & times" }],
    },
    { id: "num-5", written: "5", kana: "ご", romaji: "go", meaning: "five", value: 5 },
    { id: "num-6", written: "6", kana: "ろく", romaji: "roku", meaning: "six", value: 6 },
    {
      id: "num-7",
      written: "7",
      kana: "なな",
      romaji: "nana",
      meaning: "seven",
      value: 7,
      altReadings: [{ kana: "しち", romaji: "shichi", note: "used in times" }],
    },
    { id: "num-8", written: "8", kana: "はち", romaji: "hachi", meaning: "eight", value: 8 },
    {
      id: "num-9",
      written: "9",
      kana: "きゅう",
      romaji: "kyū",
      meaning: "nine",
      value: 9,
      altReadings: [{ kana: "く", romaji: "ku", note: "used in times" }],
    },
    { id: "num-10", written: "10", kana: "じゅう", romaji: "jū", meaning: "ten", value: 10 },
  ],
)

const numbers11to20 = mod(
  "num-11-20",
  "numbers",
  "Numbers 11–20",
  "じゅういち〜にじゅう",
  "Combine tens and ones — the pattern is completely regular here.",
  [
    { id: "num-11", written: "11", kana: "じゅういち", romaji: "jūichi", meaning: "eleven", value: 11 },
    { id: "num-12", written: "12", kana: "じゅうに", romaji: "jūni", meaning: "twelve", value: 12 },
    { id: "num-13", written: "13", kana: "じゅうさん", romaji: "jūsan", meaning: "thirteen", value: 13 },
    { id: "num-14", written: "14", kana: "じゅうよん", romaji: "jūyon", meaning: "fourteen", value: 14 },
    { id: "num-15", written: "15", kana: "じゅうご", romaji: "jūgo", meaning: "fifteen", value: 15 },
    { id: "num-16", written: "16", kana: "じゅうろく", romaji: "jūroku", meaning: "sixteen", value: 16 },
    { id: "num-17", written: "17", kana: "じゅうなな", romaji: "jūnana", meaning: "seventeen", value: 17 },
    { id: "num-18", written: "18", kana: "じゅうはち", romaji: "jūhachi", meaning: "eighteen", value: 18 },
    { id: "num-19", written: "19", kana: "じゅうきゅう", romaji: "jūkyū", meaning: "nineteen", value: 19 },
    { id: "num-20", written: "20", kana: "にじゅう", romaji: "nijū", meaning: "twenty", value: 20 },
  ],
  ["num-1-10"],
)

const numbersTens = mod(
  "num-tens",
  "numbers",
  "Tens: 10–90",
  "じゅう〜きゅうじゅう",
  "Count by tens up to ninety.",
  [
    { id: "num-t10", written: "10", kana: "じゅう", romaji: "jū", meaning: "ten", value: 10 },
    { id: "num-t20", written: "20", kana: "にじゅう", romaji: "nijū", meaning: "twenty", value: 20 },
    { id: "num-t30", written: "30", kana: "さんじゅう", romaji: "sanjū", meaning: "thirty", value: 30 },
    { id: "num-t40", written: "40", kana: "よんじゅう", romaji: "yonjū", meaning: "forty", value: 40 },
    { id: "num-t50", written: "50", kana: "ごじゅう", romaji: "gojū", meaning: "fifty", value: 50 },
    { id: "num-t60", written: "60", kana: "ろくじゅう", romaji: "rokujū", meaning: "sixty", value: 60 },
    { id: "num-t70", written: "70", kana: "ななじゅう", romaji: "nanajū", meaning: "seventy", value: 70 },
    { id: "num-t80", written: "80", kana: "はちじゅう", romaji: "hachijū", meaning: "eighty", value: 80 },
    { id: "num-t90", written: "90", kana: "きゅうじゅう", romaji: "kyūjū", meaning: "ninety", value: 90 },
  ],
  ["num-11-20"],
)

const numbersHundreds = mod(
  "num-hundreds",
  "numbers",
  "Hundreds",
  "ひゃく",
  "Watch for the sound changes at 300, 600 and 800.",
  [
    { id: "num-h100", written: "100", kana: "ひゃく", romaji: "hyaku", meaning: "one hundred", value: 100 },
    { id: "num-h200", written: "200", kana: "にひゃく", romaji: "nihyaku", meaning: "two hundred", value: 200 },
    { id: "num-h300", written: "300", kana: "さんびゃく", romaji: "sanbyaku", meaning: "three hundred", value: 300, irregular: true },
    { id: "num-h400", written: "400", kana: "よんひゃく", romaji: "yonhyaku", meaning: "four hundred", value: 400 },
    { id: "num-h500", written: "500", kana: "ごひゃく", romaji: "gohyaku", meaning: "five hundred", value: 500 },
    { id: "num-h600", written: "600", kana: "ろっぴゃく", romaji: "roppyaku", meaning: "six hundred", value: 600, irregular: true },
    { id: "num-h700", written: "700", kana: "ななひゃく", romaji: "nanahyaku", meaning: "seven hundred", value: 700 },
    { id: "num-h800", written: "800", kana: "はっぴゃく", romaji: "happyaku", meaning: "eight hundred", value: 800, irregular: true },
    { id: "num-h900", written: "900", kana: "きゅうひゃく", romaji: "kyūhyaku", meaning: "nine hundred", value: 900 },
  ],
  ["num-tens"],
)

const numbersThousands = mod(
  "num-thousands",
  "numbers",
  "Thousands & 万",
  "せん・まん",
  "Thousands, plus the all-important 万 (ten-thousand) unit.",
  [
    { id: "num-k1000", written: "1,000", kana: "せん", romaji: "sen", meaning: "one thousand", value: 1000 },
    { id: "num-k2000", written: "2,000", kana: "にせん", romaji: "nisen", meaning: "two thousand", value: 2000 },
    { id: "num-k3000", written: "3,000", kana: "さんぜん", romaji: "sanzen", meaning: "three thousand", value: 3000, irregular: true },
    { id: "num-k8000", written: "8,000", kana: "はっせん", romaji: "hassen", meaning: "eight thousand", value: 8000, irregular: true },
    { id: "num-man1", written: "10,000", kana: "いちまん", romaji: "ichiman", meaning: "ten thousand", value: 10000 },
    { id: "num-man3", written: "30,000", kana: "さんまん", romaji: "sanman", meaning: "thirty thousand", value: 30000 },
  ],
  ["num-hundreds"],
)

const timeHours = mod(
  "time-hours",
  "time",
  "Telling the hour",
  "〜じ",
  "Add 時 (じ) to a number. Four, seven and nine are irregular.",
  [
    { id: "time-h1", written: "1時", kana: "いちじ", romaji: "ichiji", meaning: "1 o'clock", value: 1 },
    { id: "time-h2", written: "2時", kana: "にじ", romaji: "niji", meaning: "2 o'clock", value: 2 },
    { id: "time-h3", written: "3時", kana: "さんじ", romaji: "sanji", meaning: "3 o'clock", value: 3 },
    { id: "time-h4", written: "4時", kana: "よじ", romaji: "yoji", meaning: "4 o'clock", value: 4, irregular: true },
    { id: "time-h5", written: "5時", kana: "ごじ", romaji: "goji", meaning: "5 o'clock", value: 5 },
    { id: "time-h6", written: "6時", kana: "ろくじ", romaji: "rokuji", meaning: "6 o'clock", value: 6 },
    { id: "time-h7", written: "7時", kana: "しちじ", romaji: "shichiji", meaning: "7 o'clock", value: 7, irregular: true },
    { id: "time-h8", written: "8時", kana: "はちじ", romaji: "hachiji", meaning: "8 o'clock", value: 8 },
    { id: "time-h9", written: "9時", kana: "くじ", romaji: "kuji", meaning: "9 o'clock", value: 9, irregular: true },
    { id: "time-h10", written: "10時", kana: "じゅうじ", romaji: "jūji", meaning: "10 o'clock", value: 10 },
    { id: "time-h11", written: "11時", kana: "じゅういちじ", romaji: "jūichiji", meaning: "11 o'clock", value: 11 },
    { id: "time-h12", written: "12時", kana: "じゅうにじ", romaji: "jūniji", meaning: "12 o'clock", value: 12 },
  ],
  ["num-1-10"],
)

const timeMinutes = mod(
  "time-minutes",
  "time",
  "Minutes",
  "〜ふん / 〜ぷん",
  "分 switches between ふん and ぷん. Several forms are irregular.",
  [
    { id: "time-m1", written: "1分", kana: "いっぷん", romaji: "ippun", meaning: "1 minute", value: 1, irregular: true },
    { id: "time-m2", written: "2分", kana: "にふん", romaji: "nifun", meaning: "2 minutes", value: 2 },
    { id: "time-m3", written: "3分", kana: "さんぷん", romaji: "sanpun", meaning: "3 minutes", value: 3, irregular: true },
    { id: "time-m4", written: "4分", kana: "よんぷん", romaji: "yonpun", meaning: "4 minutes", value: 4 },
    { id: "time-m5", written: "5分", kana: "ごふん", romaji: "gofun", meaning: "5 minutes", value: 5 },
    { id: "time-m6", written: "6分", kana: "ろっぷん", romaji: "roppun", meaning: "6 minutes", value: 6, irregular: true },
    { id: "time-m8", written: "8分", kana: "はっぷん", romaji: "happun", meaning: "8 minutes", value: 8, irregular: true },
    { id: "time-m10", written: "10分", kana: "じゅっぷん", romaji: "juppun", meaning: "10 minutes", value: 10, irregular: true },
    { id: "time-half", written: "半", kana: "はん", romaji: "han", meaning: "half past" },
  ],
  ["time-hours"],
)

const timePeriods = mod(
  "time-periods",
  "time",
  "AM, PM & full times",
  "ごぜん・ごご",
  "午前 (AM) and 午後 (PM), then read whole clock times.",
  [
    { id: "time-am", written: "午前", kana: "ごぜん", romaji: "gozen", meaning: "a.m. / morning" },
    { id: "time-pm", written: "午後", kana: "ごご", romaji: "gogo", meaning: "p.m. / afternoon" },
    { id: "time-730", written: "7時半", kana: "しちじはん", romaji: "shichiji han", meaning: "7:30", irregular: true },
    { id: "time-pm730", written: "午後7時半", kana: "ごごしちじはん", romaji: "gogo shichiji han", meaning: "7:30 p.m.", irregular: true },
    { id: "time-915", written: "9時15分", kana: "くじじゅうごふん", romaji: "kuji jūgofun", meaning: "9:15", irregular: true },
  ],
  ["time-minutes"],
)

const calWeek = mod(
  "cal-week",
  "calendar",
  "Days of the week",
  "〜ようび",
  "The seven weekday names, each ending in 曜日 (ようび).",
  [
    { id: "cal-mon", written: "月曜日", kana: "げつようび", romaji: "getsuyōbi", meaning: "Monday" },
    { id: "cal-tue", written: "火曜日", kana: "かようび", romaji: "kayōbi", meaning: "Tuesday" },
    { id: "cal-wed", written: "水曜日", kana: "すいようび", romaji: "suiyōbi", meaning: "Wednesday" },
    { id: "cal-thu", written: "木曜日", kana: "もくようび", romaji: "mokuyōbi", meaning: "Thursday" },
    { id: "cal-fri", written: "金曜日", kana: "きんようび", romaji: "kinyōbi", meaning: "Friday" },
    { id: "cal-sat", written: "土曜日", kana: "どようび", romaji: "doyōbi", meaning: "Saturday" },
    { id: "cal-sun", written: "日曜日", kana: "にちようび", romaji: "nichiyōbi", meaning: "Sunday" },
  ],
  ["num-1-10"],
)

const calMonths = mod(
  "cal-months",
  "calendar",
  "Months",
  "〜がつ",
  "Number + 月 (がつ). April, July and September are irregular.",
  [
    { id: "cal-mon1", written: "1月", kana: "いちがつ", romaji: "ichigatsu", meaning: "January", value: 1 },
    { id: "cal-mon2", written: "2月", kana: "にがつ", romaji: "nigatsu", meaning: "February", value: 2 },
    { id: "cal-mon3", written: "3月", kana: "さんがつ", romaji: "sangatsu", meaning: "March", value: 3 },
    { id: "cal-mon4", written: "4月", kana: "しがつ", romaji: "shigatsu", meaning: "April", value: 4, irregular: true },
    { id: "cal-mon5", written: "5月", kana: "ごがつ", romaji: "gogatsu", meaning: "May", value: 5 },
    { id: "cal-mon6", written: "6月", kana: "ろくがつ", romaji: "rokugatsu", meaning: "June", value: 6 },
    { id: "cal-mon7", written: "7月", kana: "しちがつ", romaji: "shichigatsu", meaning: "July", value: 7, irregular: true },
    { id: "cal-mon8", written: "8月", kana: "はちがつ", romaji: "hachigatsu", meaning: "August", value: 8 },
    { id: "cal-mon9", written: "9月", kana: "くがつ", romaji: "kugatsu", meaning: "September", value: 9, irregular: true },
    { id: "cal-mon10", written: "10月", kana: "じゅうがつ", romaji: "jūgatsu", meaning: "October", value: 10 },
    { id: "cal-mon11", written: "11月", kana: "じゅういちがつ", romaji: "jūichigatsu", meaning: "November", value: 11 },
    { id: "cal-mon12", written: "12月", kana: "じゅうにがつ", romaji: "jūnigatsu", meaning: "December", value: 12 },
  ],
  ["num-11-20"],
)

const calDatesEarly = mod(
  "cal-dates-1-10",
  "calendar",
  "Dates 1–10",
  "ついたち〜とおか",
  "The first ten days use special native readings — almost all irregular.",
  [
    { id: "cal-d1", written: "1日", kana: "ついたち", romaji: "tsuitachi", meaning: "1st", value: 1, irregular: true },
    { id: "cal-d2", written: "2日", kana: "ふつか", romaji: "futsuka", meaning: "2nd", value: 2, irregular: true },
    { id: "cal-d3", written: "3日", kana: "みっか", romaji: "mikka", meaning: "3rd", value: 3, irregular: true },
    { id: "cal-d4", written: "4日", kana: "よっか", romaji: "yokka", meaning: "4th", value: 4, irregular: true },
    { id: "cal-d5", written: "5日", kana: "いつか", romaji: "itsuka", meaning: "5th", value: 5, irregular: true },
    { id: "cal-d6", written: "6日", kana: "むいか", romaji: "muika", meaning: "6th", value: 6, irregular: true },
    { id: "cal-d7", written: "7日", kana: "なのか", romaji: "nanoka", meaning: "7th", value: 7, irregular: true },
    { id: "cal-d8", written: "8日", kana: "ようか", romaji: "yōka", meaning: "8th", value: 8, irregular: true },
    { id: "cal-d9", written: "9日", kana: "ここのか", romaji: "kokonoka", meaning: "9th", value: 9, irregular: true },
    { id: "cal-d10", written: "10日", kana: "とおか", romaji: "tōka", meaning: "10th", value: 10, irregular: true },
  ],
  ["num-1-10"],
)

const calDatesLate = mod(
  "cal-dates-11-31",
  "calendar",
  "Dates 11–31",
  "〜にち",
  "Most take 〜にち, but 14th, 20th and 24th keep special readings.",
  [
    { id: "cal-d11", written: "11日", kana: "じゅういちにち", romaji: "jūichinichi", meaning: "11th", value: 11 },
    { id: "cal-d12", written: "12日", kana: "じゅうににち", romaji: "jūninichi", meaning: "12th", value: 12 },
    { id: "cal-d13", written: "13日", kana: "じゅうさんにち", romaji: "jūsannichi", meaning: "13th", value: 13 },
    { id: "cal-d14", written: "14日", kana: "じゅうよっか", romaji: "jūyokka", meaning: "14th", value: 14, irregular: true, related: ["cal-d4"] },
    { id: "cal-d15", written: "15日", kana: "じゅうごにち", romaji: "jūgonichi", meaning: "15th", value: 15 },
    { id: "cal-d20", written: "20日", kana: "はつか", romaji: "hatsuka", meaning: "20th", value: 20, irregular: true },
    { id: "cal-d24", written: "24日", kana: "にじゅうよっか", romaji: "nijūyokka", meaning: "24th", value: 24, irregular: true, related: ["cal-d4", "cal-d14"] },
    { id: "cal-d31", written: "31日", kana: "さんじゅういちにち", romaji: "sanjūichinichi", meaning: "31st", value: 31 },
  ],
  ["cal-dates-1-10"],
)

const calRelative = mod(
  "cal-relative",
  "calendar",
  "Today, this week, this year",
  "きょう・こんしゅう",
  "Relative days, weeks, months and years.",
  [
    { id: "cal-today", written: "今日", kana: "きょう", romaji: "kyō", meaning: "today", irregular: true },
    { id: "cal-tomorrow", written: "明日", kana: "あした", romaji: "ashita", meaning: "tomorrow", irregular: true },
    { id: "cal-yesterday", written: "昨日", kana: "きのう", romaji: "kinō", meaning: "yesterday", irregular: true },
    { id: "cal-thisweek", written: "今週", kana: "こんしゅう", romaji: "konshū", meaning: "this week" },
    { id: "cal-nextweek", written: "来週", kana: "らいしゅう", romaji: "raishū", meaning: "next week" },
    { id: "cal-lastweek", written: "先週", kana: "せんしゅう", romaji: "senshū", meaning: "last week" },
    { id: "cal-thismonth", written: "今月", kana: "こんげつ", romaji: "kongetsu", meaning: "this month" },
    { id: "cal-nextmonth", written: "来月", kana: "らいげつ", romaji: "raigetsu", meaning: "next month" },
    { id: "cal-thisyear", written: "今年", kana: "ことし", romaji: "kotoshi", meaning: "this year", irregular: true },
    { id: "cal-nextyear", written: "来年", kana: "らいねん", romaji: "rainen", meaning: "next year" },
    { id: "cal-lastyear", written: "去年", kana: "きょねん", romaji: "kyonen", meaning: "last year" },
  ],
  ["cal-week"],
)

const countGeneral = mod(
  "count-tsu",
  "counters",
  "General counter つ",
  "ひとつ〜とお",
  "The all-purpose counter for objects, using native numbers 1–10.",
  [
    { id: "cnt-tsu1", written: "1つ", kana: "ひとつ", romaji: "hitotsu", meaning: "one (thing)", value: 1, irregular: true },
    { id: "cnt-tsu2", written: "2つ", kana: "ふたつ", romaji: "futatsu", meaning: "two (things)", value: 2, irregular: true },
    { id: "cnt-tsu3", written: "3つ", kana: "みっつ", romaji: "mittsu", meaning: "three (things)", value: 3, irregular: true },
    { id: "cnt-tsu4", written: "4つ", kana: "よっつ", romaji: "yottsu", meaning: "four (things)", value: 4, irregular: true },
    { id: "cnt-tsu5", written: "5つ", kana: "いつつ", romaji: "itsutsu", meaning: "five (things)", value: 5, irregular: true },
    { id: "cnt-tsu6", written: "6つ", kana: "むっつ", romaji: "muttsu", meaning: "six (things)", value: 6, irregular: true },
    { id: "cnt-tsu7", written: "7つ", kana: "ななつ", romaji: "nanatsu", meaning: "seven (things)", value: 7, irregular: true },
    { id: "cnt-tsu8", written: "8つ", kana: "やっつ", romaji: "yattsu", meaning: "eight (things)", value: 8, irregular: true },
    { id: "cnt-tsu9", written: "9つ", kana: "ここのつ", romaji: "kokonotsu", meaning: "nine (things)", value: 9, irregular: true },
    { id: "cnt-tsu10", written: "10", kana: "とお", romaji: "tō", meaning: "ten (things)", value: 10, irregular: true },
  ],
  ["num-1-10"],
)

const countPeople = mod(
  "count-people",
  "counters",
  "Counting people 人",
  "〜にん",
  "One and two people are special; the rest add 〜にん.",
  [
    { id: "cnt-p1", written: "1人", kana: "ひとり", romaji: "hitori", meaning: "1 person", value: 1, irregular: true },
    { id: "cnt-p2", written: "2人", kana: "ふたり", romaji: "futari", meaning: "2 people", value: 2, irregular: true },
    { id: "cnt-p3", written: "3人", kana: "さんにん", romaji: "sannin", meaning: "3 people", value: 3 },
    { id: "cnt-p4", written: "4人", kana: "よにん", romaji: "yonin", meaning: "4 people", value: 4, irregular: true },
    { id: "cnt-p5", written: "5人", kana: "ごにん", romaji: "gonin", meaning: "5 people", value: 5 },
  ],
  ["num-1-10"],
)

const countObjects = mod(
  "count-objects",
  "counters",
  "Long & flat things 本・枚",
  "〜ほん・〜まい",
  "枚 (flat) is regular; 本 (long) has classic sound changes.",
  [
    { id: "cnt-mai1", written: "1枚", kana: "いちまい", romaji: "ichimai", meaning: "1 flat object", value: 1 },
    { id: "cnt-mai2", written: "2枚", kana: "にまい", romaji: "nimai", meaning: "2 flat objects", value: 2 },
    { id: "cnt-mai3", written: "3枚", kana: "さんまい", romaji: "sanmai", meaning: "3 flat objects", value: 3 },
    { id: "cnt-hon1", written: "1本", kana: "いっぽん", romaji: "ippon", meaning: "1 long object", value: 1, irregular: true },
    { id: "cnt-hon2", written: "2本", kana: "にほん", romaji: "nihon", meaning: "2 long objects", value: 2 },
    { id: "cnt-hon3", written: "3本", kana: "さんぼん", romaji: "sanbon", meaning: "3 long objects", value: 3, irregular: true },
    { id: "cnt-hon6", written: "6本", kana: "ろっぽん", romaji: "roppon", meaning: "6 long objects", value: 6, irregular: true },
  ],
  ["count-people"],
)

const duration = mod(
  "duration",
  "duration",
  "How long? Durations",
  "〜かん",
  "A length of time, not a point on the clock. Compare 1日 (duration) with the date ついたち.",
  [
    { id: "dur-min10", written: "10分間", kana: "じゅっぷんかん", romaji: "juppunkan", meaning: "for 10 minutes", irregular: true },
    { id: "dur-hour1", written: "1時間", kana: "いちじかん", romaji: "ichijikan", meaning: "1 hour" },
    { id: "dur-hour3", written: "3時間", kana: "さんじかん", romaji: "sanjikan", meaning: "3 hours" },
    { id: "dur-day1", written: "1日", kana: "いちにち", romaji: "ichinichi", meaning: "1 day (duration)", irregular: true, related: ["cal-d1"] },
    { id: "dur-day2", written: "2日間", kana: "ふつかかん", romaji: "futsukakan", meaning: "for 2 days", related: ["cal-d2"] },
    { id: "dur-week1", written: "1週間", kana: "いっしゅうかん", romaji: "isshūkan", meaning: "1 week", irregular: true },
    { id: "dur-month1", written: "1か月", kana: "いっかげつ", romaji: "ikkagetsu", meaning: "1 month", irregular: true },
    { id: "dur-year1", written: "1年", kana: "いちねん", romaji: "ichinen", meaning: "1 year" },
  ],
  ["time-minutes"],
)

const money = mod(
  "money",
  "money",
  "Money 円",
  "〜えん",
  "Read real prices in yen, from ¥100 up to ¥10,000.",
  [
    { id: "yen-100", written: "¥100", kana: "ひゃくえん", romaji: "hyaku en", meaning: "100 yen", value: 100 },
    { id: "yen-500", written: "¥500", kana: "ごひゃくえん", romaji: "gohyaku en", meaning: "500 yen", value: 500 },
    { id: "yen-1000", written: "¥1,000", kana: "せんえん", romaji: "sen en", meaning: "1,000 yen", value: 1000 },
    { id: "yen-1980", written: "¥1,980", kana: "せんきゅうひゃくはちじゅうえん", romaji: "sen kyūhyaku hachijū en", meaning: "1,980 yen", value: 1980 },
    { id: "yen-5000", written: "¥5,000", kana: "ごせんえん", romaji: "gosen en", meaning: "5,000 yen", value: 5000 },
    { id: "yen-10000", written: "¥10,000", kana: "いちまんえん", romaji: "ichiman en", meaning: "10,000 yen", value: 10000 },
  ],
  ["num-hundreds"],
)

const age = mod(
  "age",
  "age",
  "Age 歳",
  "〜さい",
  "歳 counts years of age. 1, 8, 10 and especially 20 are irregular.",
  [
    { id: "age-1", written: "1歳", kana: "いっさい", romaji: "issai", meaning: "1 year old", value: 1, irregular: true },
    { id: "age-2", written: "2歳", kana: "にさい", romaji: "nisai", meaning: "2 years old", value: 2 },
    { id: "age-3", written: "3歳", kana: "さんさい", romaji: "sansai", meaning: "3 years old", value: 3 },
    { id: "age-8", written: "8歳", kana: "はっさい", romaji: "hassai", meaning: "8 years old", value: 8, irregular: true },
    { id: "age-10", written: "10歳", kana: "じゅっさい", romaji: "jussai", meaning: "10 years old", value: 10, irregular: true },
    { id: "age-20", written: "20歳", kana: "はたち", romaji: "hatachi", meaning: "20 years old", value: 20, irregular: true },
  ],
  ["num-tens"],
)

const combos = mod(
  "combos",
  "combos",
  "Real-world combinations",
  "じっせん",
  "Put it together — dates, times, people and prices in one phrase.",
  [
    { id: "cmb-tue330", written: "火曜日の3時半", kana: "かようびのさんじはん", romaji: "kayōbi no sanji han", meaning: "Tuesday at 3:30", irregular: true },
    { id: "cmb-mar14", written: "3月14日", kana: "さんがつじゅうよっか", romaji: "sangatsu jūyokka", meaning: "March 14", irregular: true, related: ["cal-d14"] },
    { id: "cmb-2people", written: "2人", kana: "ふたり", romaji: "futari", meaning: "2 people", irregular: true, related: ["cnt-p2"] },
    { id: "cmb-2800", written: "¥2,800", kana: "にせんはっぴゃくえん", romaji: "nisen happyaku en", meaning: "2,800 yen", value: 2800, irregular: true },
    { id: "cmb-2hours", written: "2時間", kana: "にじかん", romaji: "nijikan", meaning: "for 2 hours" },
  ],
  ["time-periods", "cal-dates-11-31", "money", "count-people"],
)

const BUILT = [
  numbers1to10,
  numbers11to20,
  numbersTens,
  numbersHundreds,
  numbersThousands,
  timeHours,
  timeMinutes,
  timePeriods,
  calWeek,
  calMonths,
  calDatesEarly,
  calDatesLate,
  calRelative,
  countGeneral,
  countPeople,
  countObjects,
  duration,
  money,
  age,
  combos,
]

export const PRACTICAL_MODULES: PracticalModule[] = BUILT.map((b) => b.module)

export const PRACTICAL_MODULES_BY_ID: Record<string, PracticalModule> = Object.fromEntries(
  PRACTICAL_MODULES.map((m) => [m.id, m]),
)

export const ALL_PRACTICAL_ITEMS: PracticalItem[] = BUILT.flatMap((b) => b.items)

export const PRACTICAL_ITEMS_BY_ID: Record<string, PracticalItem> = Object.fromEntries(
  ALL_PRACTICAL_ITEMS.map((i) => [i.id, i]),
)

// Prerequisite kana are derived once from each item's reading.
const REQUIRED_KANA: Record<string, string[]> = Object.fromEntries(
  ALL_PRACTICAL_ITEMS.map((i) => [
    i.id,
    [...new Set([...decomposeReading(i.kana), ...(i.extraPrereqKana ?? [])])],
  ]),
)

export function itemRequiredKana(itemId: string): string[] {
  return REQUIRED_KANA[itemId] ?? []
}

export function getPracticalItem(id: string): PracticalItem | undefined {
  return PRACTICAL_ITEMS_BY_ID[id]
}

/** Union of prerequisite kana across every item in a module. */
export function moduleRequiredKana(moduleId: string): string[] {
  const m = PRACTICAL_MODULES_BY_ID[moduleId]
  if (!m) return []
  return [...new Set(m.itemIds.flatMap((id) => itemRequiredKana(id)))]
}
