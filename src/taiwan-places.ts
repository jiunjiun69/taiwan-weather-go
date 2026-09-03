export type Region = "北部" | "中部" | "南部" | "東部" | "離島";

export type City = {
  id: string;
  name: string;
  shortName: string;
  region: Region;
  latitude: number;
  longitude: number;
};

export type Place = {
  id: string;
  name: string;
  shortName: string;
  cityId: string;
  cityName: string;
  region: Region;
  latitude: number;
  longitude: number;
  role?: string;
};

export const CITIES: City[] = [
  { id: "keelung", name: "基隆市", shortName: "基隆", region: "北部", latitude: 25.1283, longitude: 121.7419 },
  { id: "taipei", name: "臺北市", shortName: "臺北", region: "北部", latitude: 25.0375, longitude: 121.5637 },
  { id: "new-taipei", name: "新北市", shortName: "新北", region: "北部", latitude: 25.0169, longitude: 121.4628 },
  { id: "taoyuan", name: "桃園市", shortName: "桃園", region: "北部", latitude: 24.9937, longitude: 121.301 },
  { id: "hsinchu-city", name: "新竹市", shortName: "新竹市", region: "北部", latitude: 24.8138, longitude: 120.9675 },
  { id: "hsinchu-county", name: "新竹縣", shortName: "新竹縣", region: "北部", latitude: 24.8387, longitude: 121.0177 },
  { id: "miaoli", name: "苗栗縣", shortName: "苗栗", region: "中部", latitude: 24.5602, longitude: 120.8214 },
  { id: "taichung", name: "臺中市", shortName: "臺中", region: "中部", latitude: 24.1477, longitude: 120.6736 },
  { id: "changhua", name: "彰化縣", shortName: "彰化", region: "中部", latitude: 24.0756, longitude: 120.544 },
  { id: "nantou", name: "南投縣", shortName: "南投", region: "中部", latitude: 23.9609, longitude: 120.9719 },
  { id: "yunlin", name: "雲林縣", shortName: "雲林", region: "中部", latitude: 23.7092, longitude: 120.4313 },
  { id: "chiayi-city", name: "嘉義市", shortName: "嘉義", region: "南部", latitude: 23.4801, longitude: 120.4491 },
  { id: "chiayi-county", name: "嘉義縣", shortName: "嘉義縣", region: "南部", latitude: 23.4518, longitude: 120.2555 },
  { id: "tainan", name: "臺南市", shortName: "臺南", region: "南部", latitude: 22.9999, longitude: 120.2269 },
  { id: "kaohsiung", name: "高雄市", shortName: "高雄", region: "南部", latitude: 22.6273, longitude: 120.3014 },
  { id: "pingtung", name: "屏東縣", shortName: "屏東", region: "南部", latitude: 22.5519, longitude: 120.5488 },
  { id: "yilan", name: "宜蘭縣", shortName: "宜蘭", region: "東部", latitude: 24.7021, longitude: 121.7378 },
  { id: "hualien", name: "花蓮縣", shortName: "花蓮", region: "東部", latitude: 23.9911, longitude: 121.6112 },
  { id: "taitung", name: "臺東縣", shortName: "臺東", region: "東部", latitude: 22.7554, longitude: 121.15 },
  { id: "penghu", name: "澎湖縣", shortName: "澎湖", region: "離島", latitude: 23.5712, longitude: 119.5793 },
  { id: "kinmen", name: "金門縣", shortName: "金門", region: "離島", latitude: 24.4321, longitude: 118.3171 },
  { id: "lienchiang", name: "連江縣", shortName: "馬祖", region: "離島", latitude: 26.1605, longitude: 119.9517 },
];

export const FEATURED_PLACES: Place[] = [
  { id: "kaohsiung-nanzi", name: "楠梓區", shortName: "楠梓", cityId: "kaohsiung", cityName: "高雄市", region: "南部", latitude: 22.7286, longitude: 120.3277, role: "上班" },
  { id: "chiayi-shuishang", name: "水上鄉", shortName: "水上", cityId: "chiayi-county", cityName: "嘉義縣", region: "南部", latitude: 23.4248, longitude: 120.3973, role: "返家" },
  { id: "kaohsiung-lingya", name: "苓雅區", shortName: "苓雅", cityId: "kaohsiung", cityName: "高雄市", region: "南部", latitude: 22.6265, longitude: 120.312, role: "假日" },
  { id: "kaohsiung-qianzhen", name: "前鎮區", shortName: "前鎮", cityId: "kaohsiung", cityName: "高雄市", region: "南部", latitude: 22.5908, longitude: 120.3091, role: "假日" },
  { id: "chiayi-west", name: "西區", shortName: "嘉義西區", cityId: "chiayi-city", cityName: "嘉義市", region: "南部", latitude: 23.4797, longitude: 120.4246, role: "逛街" },
];

export const DISTRICTS_BY_CITY: Record<string, readonly string[]> = {
  keelung: ["中正區", "七堵區", "暖暖區", "仁愛區", "中山區", "安樂區", "信義區"],
  taipei: ["松山區", "信義區", "大安區", "中山區", "中正區", "大同區", "萬華區", "文山區", "南港區", "內湖區", "士林區", "北投區"],
  "new-taipei": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "樹林區", "鶯歌區", "三峽區", "淡水區", "汐止區", "瑞芳區", "土城區", "蘆洲區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區", "三芝區", "石門區", "八里區", "平溪區", "雙溪區", "貢寮區", "金山區", "萬里區", "烏來區"],
  taoyuan: ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "大溪區", "龍潭區", "龜山區", "大園區", "觀音區", "新屋區", "復興區"],
  "hsinchu-city": ["東區", "北區", "香山區"],
  "hsinchu-county": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "峨眉鄉", "寶山鄉", "北埔鄉", "芎林鄉", "橫山鄉", "尖石鄉", "五峰鄉"],
  miaoli: ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "卓蘭鎮", "造橋鄉", "西湖鄉", "頭屋鄉", "公館鄉", "銅鑼鄉", "三義鄉", "大湖鄉", "獅潭鄉", "三灣鄉", "南庄鄉", "泰安鄉"],
  taichung: ["中區", "東區", "南區", "西區", "北區", "西屯區", "南屯區", "北屯區", "豐原區", "東勢區", "大甲區", "清水區", "沙鹿區", "梧棲區", "后里區", "神岡區", "潭子區", "大雅區", "新社區", "石岡區", "外埔區", "大安區", "烏日區", "大肚區", "龍井區", "霧峰區", "太平區", "大里區", "和平區"],
  changhua: ["彰化市", "員林市", "和美鎮", "鹿港鎮", "溪湖鎮", "二林鎮", "田中鎮", "北斗鎮", "花壇鄉", "芬園鄉", "大村鄉", "永靖鄉", "伸港鄉", "線西鄉", "福興鄉", "秀水鄉", "埔心鄉", "埔鹽鄉", "大城鄉", "芳苑鄉", "竹塘鄉", "社頭鄉", "二水鄉", "田尾鄉", "埤頭鄉", "溪州鄉"],
  nantou: ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "中寮鄉", "魚池鄉", "國姓鄉", "水里鄉", "信義鄉", "仁愛鄉"],
  yunlin: ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "古坑鄉", "大埤鄉", "莿桐鄉", "林內鄉", "二崙鄉", "崙背鄉", "麥寮鄉", "東勢鄉", "褒忠鄉", "臺西鄉", "元長鄉", "四湖鄉", "口湖鄉", "水林鄉"],
  "chiayi-city": ["東區", "西區"],
  "chiayi-county": ["太保市", "朴子市", "布袋鎮", "大林鎮", "民雄鄉", "溪口鄉", "新港鄉", "六腳鄉", "東石鄉", "義竹鄉", "鹿草鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "番路鄉", "大埔鄉", "阿里山鄉"],
  tainan: ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
  kaohsiung: ["楠梓區", "左營區", "鼓山區", "三民區", "鹽埕區", "前金區", "新興區", "苓雅區", "前鎮區", "旗津區", "小港區", "鳳山區", "林園區", "大寮區", "大樹區", "大社區", "仁武區", "鳥松區", "岡山區", "橋頭區", "燕巢區", "田寮區", "阿蓮區", "路竹區", "湖內區", "茄萣區", "永安區", "彌陀區", "梓官區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
  pingtung: ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧臺鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"],
  yilan: ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
  hualien: ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"],
  taitung: ["臺東市", "成功鎮", "關山鎮", "卑南鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉", "蘭嶼鄉"],
  penghu: ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
  kinmen: ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"],
  lienchiang: ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"],
};

export const BASE_LOCATIONS = [
  ...CITIES.map((city) => ({ id: city.id, latitude: city.latitude, longitude: city.longitude })),
  ...FEATURED_PLACES.map((place) => ({ id: place.id, latitude: place.latitude, longitude: place.longitude })),
];

export function districtPlaceId(cityId: string, districtName: string) {
  return `district:${cityId}:${districtName}`;
}

export function findFeaturedPlace(cityId: string, districtName: string) {
  return FEATURED_PLACES.find((place) => place.cityId === cityId && place.name === districtName);
}
