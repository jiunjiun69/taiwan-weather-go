import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BASE_LOCATIONS,
  CITIES,
  DISTRICTS_BY_CITY,
  FEATURED_PLACES,
  districtPlaceId,
  findFeaturedPlace,
  type Place,
} from "./taiwan-places";
import { getDistrictCoordinates } from "./taiwan-district-coordinates";

type WeatherLocation = {
  cityId: string;
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    precipitation: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
};

type WeatherResponse = {
  source: string;
  fetchedAt: string;
  locations: WeatherLocation[];
  offline?: boolean;
};

type AlertItem = {
  title: string;
  description: string;
  link: string;
  publishedAt: string | null;
};

type AlertsResponse = {
  available: boolean;
  activeTyphoon: boolean;
  statusText: string;
  typhoonItems: AlertItem[];
  alerts: AlertItem[];
  fetchedAt: string;
};

type IconName =
  | "cloud-sun"
  | "pin"
  | "umbrella"
  | "droplet"
  | "wind"
  | "refresh"
  | "navigation"
  | "typhoon"
  | "arrow"
  | "swap"
  | "clock"
  | "temperature"
  | "external"
  | "sun"
  | "moon"
  | "system";

type ThemePreference = "system" | "light" | "dark";

const CWA_TYPHOON_URL = "https://www.cwa.gov.tw/V8/C/P/Typhoon/TY_NEWS.html";
const CWA_HOME_URL = "https://www.cwa.gov.tw/";
const ALERTS_URL = `${import.meta.env.BASE_URL}data/alerts.json`;
const REGIONS = ["全部", "北部", "中部", "南部", "東部", "離島"] as const;
const CITY_PLACES: Place[] = CITIES.map((city) => ({
  ...city,
  cityId: city.id,
  cityName: city.name,
}));
const STATIC_PLACES = [...FEATURED_PLACES, ...CITY_PLACES];
const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: "system", label: "跟隨系統", icon: "system" },
  { value: "light", label: "淺色模式", icon: "sun" },
  { value: "dark", label: "黑暗模式", icon: "moon" },
];

function openMeteoUrl() {
  const params = new URLSearchParams({
    latitude: BASE_LOCATIONS.map((location) => location.latitude).join(","),
    longitude: BASE_LOCATIONS.map((location) => location.longitude).join(","),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "Asia/Taipei",
    forecast_days: "7",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function openMeteoLocationUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "Asia/Taipei",
    forecast_days: "7",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function normalizeOpenMeteo(payload: unknown): WeatherResponse {
  const results = Array.isArray(payload) ? payload : [payload];
  return {
    source: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
    locations: results.map((result, index) => ({
      ...(result as Omit<WeatherLocation, "cityId">),
      cityId: BASE_LOCATIONS[index]?.id ?? `location-${index}`,
    })),
  };
}

function fullPlaceName(place: Place) {
  return place.id === place.cityId ? place.name : `${place.cityName}${place.name}`;
}

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    "cloud-sun": <><path d="M12 2v2M4.93 4.93l1.42 1.42M2 12h2M19.07 4.93l-1.42 1.42M20 12h2" /><path d="M16 8.5A5 5 0 0 0 6.5 10a4 4 0 0 0 .5 8h10a3.5 3.5 0 0 0-1-6.85A5 5 0 0 0 16 8.5Z" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    umbrella: <><path d="M3 12a9 9 0 0 1 18 0H3Z" /><path d="M12 12v7a2 2 0 0 0 4 0" /><path d="M12 3v1" /></>,
    droplet: <path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" />,
    wind: <><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h16a2 2 0 1 1-2 2" /><path d="M3 16h8" /></>,
    refresh: <><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18.4 9A7 7 0 0 0 6.3 6.3L4 11M20 13l-2.3 4.7A7 7 0 0 1 5.6 15" /></>,
    navigation: <path d="m3 11 19-9-9 19-2-8-8-2Z" />,
    typhoon: <><path d="M12 2a7 7 0 0 0-7 7c0 3.9 3.1 7 7 7a4 4 0 0 0 4-4c0-2.2-1.8-4-4-4a1 1 0 0 0-1 1c0 .6.4 1 1 1" /><path d="M12 22a7 7 0 0 0 7-7c0-3.9-3.1-7-7-7a4 4 0 0 0-4 4c0 2.2 1.8 4 4 4a1 1 0 0 0 1-1c0-.6-.4-1-1-1" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    swap: <><path d="m7 7-4 4 4 4" /><path d="M3 11h14" /><path d="m17 3 4 4-4 4" /><path d="M21 7H7" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    temperature: <><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" /><path d="M12 12v6" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4Z" />,
    system: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function WeatherIcon({ code, size = 52 }: { code: number; size?: number }) {
  if (code === 0) {
    return <svg className="weather-icon sun" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="11" /><path d="M32 5v10M32 49v10M5 32h10M49 32h10M13 13l7 7M44 44l7 7M51 13l-7 7M20 44l-7 7" /></svg>;
  }
  if ([1, 2, 3, 45, 48].includes(code)) {
    return <svg className="weather-icon cloud" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M18 48h29a10 10 0 0 0 1-20 17 17 0 0 0-32-2A11 11 0 0 0 18 48Z" /></svg>;
  }
  if ([95, 96, 99].includes(code)) {
    return <svg className="weather-icon storm" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M18 40h29a10 10 0 0 0 1-20 17 17 0 0 0-32-2A11 11 0 0 0 18 40Z" /><path d="m33 38-7 13h8l-3 10 12-17h-8l4-6" /></svg>;
  }
  return <svg className="weather-icon rain" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M18 38h29a10 10 0 0 0 1-20 17 17 0 0 0-32-2A11 11 0 0 0 18 38Z" /><path d="m21 46-3 7M33 46l-3 7M45 46l-3 7" /></svg>;
}

function describeWeather(code: number) {
  if (code === 0) return "晴朗";
  if (code === 1) return "大致晴朗";
  if (code === 2) return "局部多雲";
  if (code === 3) return "陰天";
  if ([45, 48].includes(code)) return "有霧";
  if ([51, 53, 55, 56, 57].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 66, 67].includes(code)) return "有雨";
  if ([80, 81, 82].includes(code)) return "短暫陣雨";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天氣多變";
}

function round(value: number | undefined) {
  return Math.round(value ?? 0);
}

function hourLabel(time: string) {
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function weekdayLabel(time: string, index: number) {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  return new Intl.DateTimeFormat("zh-TW", { weekday: "short" }).format(new Date(`${time}T12:00:00`));
}

function futureStartIndex(location: WeatherLocation) {
  const current = new Date(location.current.time).getTime();
  const found = location.hourly.time.findIndex((time) => new Date(time).getTime() >= current);
  return found < 0 ? 0 : found;
}

function getHourSlice(location: WeatherLocation, count = 9) {
  const start = futureStartIndex(location);
  return location.hourly.time.slice(start, start + count).map((time, offset) => {
    const index = start + offset;
    return {
      time,
      probability: location.hourly.precipitation_probability[index] ?? 0,
      precipitation: location.hourly.precipitation[index] ?? 0,
      temperature: location.hourly.temperature_2m[index] ?? 0,
      apparent: location.hourly.apparent_temperature[index] ?? 0,
      weatherCode: location.hourly.weather_code[index] ?? 0,
      wind: location.hourly.wind_speed_10m[index] ?? 0,
      gust: location.hourly.wind_gusts_10m[index] ?? 0,
      uv: location.hourly.uv_index[index] ?? 0,
    };
  });
}

function getUmbrellaDecision(location: WeatherLocation) {
  const hours = getHourSlice(location, 12);
  const nextThree = hours.slice(0, 3);
  const maxThree = Math.max(...nextThree.map((hour) => hour.probability), 0);
  const maxTwelve = Math.max(...hours.map((hour) => hour.probability), 0);
  const currentlyRaining = (location.current.precipitation ?? 0) >= 0.1;
  const rainyHour = hours.find((hour) => hour.probability >= 45 || hour.precipitation >= 0.3);

  if (currentlyRaining || maxThree >= 65) {
    return {
      level: "required" as const,
      headline: "現在要帶傘",
      detail: currentlyRaining
        ? "目前已有降雨，外出建議攜帶雨具並留意路面濕滑。"
        : `${rainyHour ? hourLabel(rainyHour.time) : "近期"}起降雨機率偏高，雨具先準備好。`,
      maxThree,
      maxTwelve,
    };
  }

  if (maxThree >= 40 || maxTwelve >= 60) {
    return {
      level: "recommended" as const,
      headline: "建議帶折疊傘",
      detail: rainyHour
        ? `${hourLabel(rainyHour.time)}前後較可能下雨，放把折疊傘比較安心。`
        : "短時間內天氣仍可能變化，建議準備輕便雨具。",
      maxThree,
      maxTwelve,
    };
  }

  return {
    level: "safe" as const,
    headline: "目前可不帶傘",
    detail: rainyHour
      ? `${hourLabel(rainyHour.time)}後降雨機率可能升高，晚歸可帶把折疊傘。`
      : "未來數小時降雨機率偏低，可以輕裝出門。",
    maxThree,
    maxTwelve,
  };
}

function nextRainWindow(location: WeatherLocation) {
  const hours = getHourSlice(location, 18);
  const wet = hours.filter((hour) => hour.probability >= 45 || hour.precipitation >= 0.3);
  if (!wet.length) return "未來 18 小時暫無明顯雨勢";
  const first = wet[0];
  let last = first;
  for (let i = 1; i < wet.length; i += 1) {
    const gap = new Date(wet[i].time).getTime() - new Date(last.time).getTime();
    if (gap > 60 * 60 * 1000) break;
    last = wet[i];
  }
  return first.time === last.time
    ? `${hourLabel(first.time)} 前後留意短暫雨`
    : `${hourLabel(first.time)}–${hourLabel(last.time)} 較可能有雨`;
}

function windowRisk(location: WeatherLocation, startHour: number, endHour: number) {
  const start = futureStartIndex(location);
  const now = new Date(location.current.time).getTime();
  const candidates: number[] = [];
  let selectedDate = "";

  for (let i = start; i < location.hourly.time.length; i += 1) {
    const date = new Date(location.hourly.time[i]);
    if (date.getTime() < now) continue;
    const dateKey = location.hourly.time[i].slice(0, 10);
    const hour = date.getHours();
    if (hour >= startHour && hour <= endHour) {
      if (!selectedDate) selectedDate = dateKey;
      if (dateKey !== selectedDate) break;
      candidates.push(location.hourly.precipitation_probability[i] ?? 0);
    }
  }
  return Math.max(...candidates, 0);
}

function riskAdvice(risk: number) {
  if (risk >= 70) return "雨具必備，預留交通時間";
  if (risk >= 45) return "帶折疊傘，留意短暫雨";
  if (risk >= 25) return "可輕裝，晚點再確認一次";
  return "降雨偏低，正常安排即可";
}

function buildOfflineWeather(): WeatherResponse {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const locations = BASE_LOCATIONS.map((city, cityIndex) => {
    const times = Array.from({ length: 168 }, (_, index) => {
      const date = new Date(now.getTime() + index * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      return `${year}-${month}-${day}T${hour}:00`;
    });
    const probabilities = times.map((_, index) => Math.max(5, Math.min(90, 16 + ((index * 13 + cityIndex * 7) % 58))));
    const baseTemperature = 27 + (cityIndex % 5);
    const dayTimes = Array.from({ length: 7 }, (_, index) => times[index * 24].slice(0, 10));
    return {
      cityId: city.id,
      latitude: city.latitude,
      longitude: city.longitude,
      current: {
        time: times[0],
        temperature_2m: baseTemperature,
        apparent_temperature: baseTemperature + 3,
        relative_humidity_2m: 72,
        weather_code: cityIndex % 4 === 0 ? 2 : 1,
        precipitation: 0,
        wind_speed_10m: 11,
      },
      hourly: {
        time: times,
        temperature_2m: times.map((_, index) => baseTemperature + Math.sin(index / 4) * 3),
        apparent_temperature: times.map((_, index) => baseTemperature + 3 + Math.sin(index / 4) * 3),
        precipitation_probability: probabilities,
        precipitation: probabilities.map((probability) => probability >= 65 ? 0.8 : 0),
        weather_code: probabilities.map((probability) => probability >= 65 ? 80 : probability >= 45 ? 2 : 1),
        wind_speed_10m: times.map(() => 11),
        wind_gusts_10m: times.map(() => 21),
        uv_index: times.map((time) => {
          const hour = new Date(time).getHours();
          return hour >= 10 && hour <= 14 ? 8 : 2;
        }),
      },
      daily: {
        time: dayTimes,
        weather_code: dayTimes.map((_, index) => index % 3 === 0 ? 80 : 2),
        temperature_2m_max: dayTimes.map((_, index) => baseTemperature + 4 + (index % 2)),
        temperature_2m_min: dayTimes.map(() => baseTemperature - 3),
        precipitation_probability_max: dayTimes.map((_, index) => 35 + ((index * 11 + cityIndex) % 45)),
        sunrise: dayTimes.map((day) => `${day}T05:25`),
        sunset: dayTimes.map((day) => `${day}T18:45`),
        uv_index_max: dayTimes.map(() => 9),
      },
    } satisfies WeatherLocation;
  });
  return { source: "離線範例", fetchedAt: new Date().toISOString(), locations, offline: true };
}

function PlaceSelect({ value, onChange, label, places = STATIC_PLACES }: { value: string; onChange: (value: string) => void; label: string; places?: Place[] }) {
  const hasValue = places.some((place) => place.id === value);
  const recentPlaces = places.filter((place) => (
    place.id !== place.cityId && !FEATURED_PLACES.some((featured) => featured.id === place.id)
  ));
  return (
    <label className="city-select">
      <span className="sr-only">{label}</span>
      <Icon name="pin" size={18} />
      <select value={hasValue ? value : ""} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {!hasValue && <option value="">目前查看地區</option>}
        <optgroup label="我的常用地點">
          {places.filter((place) => FEATURED_PLACES.some((featured) => featured.id === place.id)).map((place) => (
            <option key={place.id} value={place.id}>{place.cityName}・{place.name}</option>
          ))}
        </optgroup>
        {places.some((place) => place.id === place.cityId) && (
          <optgroup label="縣市概況">
            {places.filter((place) => place.id === place.cityId).map((place) => (
              <option key={place.id} value={place.id}>{place.name}</option>
            ))}
          </optgroup>
        )}
        {recentPlaces.length > 0 && (
          <optgroup label="最近查詢">
            {recentPlaces.map((place) => (
              <option key={place.id} value={place.id}>{place.cityName}・{place.name}</option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}

function ThemeSwitcher({ value, onChange }: { value: ThemePreference; onChange: (value: ThemePreference) => void }) {
  return (
    <div className="theme-switcher" role="group" aria-label="顯示模式">
      {THEME_OPTIONS.map((option) => (
        <button
          className={value === option.value ? "active" : ""}
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          aria-label={option.label}
          aria-pressed={value === option.value}
          title={option.label}
        >
          <Icon name={option.icon} size={17} />
          <span className="sr-only">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="primary-card weather-card loading-card" aria-live="polite">
      <div className="skeleton skeleton-short" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line small" />
      <span className="loading-copy">正在整理最新天氣…</span>
    </div>
  );
}

export default function Home() {
  const [primaryId, setPrimaryId] = useState("kaohsiung-nanzi");
  const [secondaryId, setSecondaryId] = useState("chiayi-shuishang");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
  const [customWeather, setCustomWeather] = useState<WeatherLocation[]>([]);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [regionFilter, setRegionFilter] = useState<(typeof REGIONS)[number]>("全部");
  const [browseCityId, setBrowseCityId] = useState("kaohsiung");
  const [browseDistrictName, setBrowseDistrictName] = useState("楠梓區");
  const [selectingDistrict, setSelectingDistrict] = useState(false);
  const [districtNotice, setDistrictNotice] = useState("可從全台 22 縣市、368 個鄉鎮市區中選擇。");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [themeReady, setThemeReady] = useState(false);

  const allPlaces = useMemo(() => [...STATIC_PLACES, ...customPlaces], [customPlaces]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("weather-theme");
    queueMicrotask(() => {
      if (savedTheme === "system" || savedTheme === "light" || savedTheme === "dark") {
        setThemePreference(savedTheme);
      }
      setThemeReady(true);
    });
  }, []);

  useEffect(() => {
    if (!themeReady) return;

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolvedTheme = themePreference === "system"
        ? (systemTheme.matches ? "dark" : "light")
        : themePreference;
      document.documentElement.dataset.theme = resolvedTheme;
    };

    applyTheme();
    window.localStorage.setItem("weather-theme", themePreference);
    if (themePreference !== "system") return;

    systemTheme.addEventListener("change", applyTheme);
    return () => systemTheme.removeEventListener("change", applyTheme);
  }, [themePreference, themeReady]);

  useEffect(() => {
    const savedPrimary = window.localStorage.getItem("weather-primary-city");
    const savedSecondary = window.localStorage.getItem("weather-secondary-city");
    queueMicrotask(() => {
      const migratedPrimary = savedPrimary === "kaohsiung" ? "kaohsiung-nanzi" : savedPrimary;
      const migratedSecondary = savedSecondary === "chiayi-city" ? "chiayi-shuishang" : savedSecondary;
      if (migratedPrimary && STATIC_PLACES.some((place) => place.id === migratedPrimary)) setPrimaryId(migratedPrimary);
      if (migratedSecondary && STATIC_PLACES.some((place) => place.id === migratedSecondary)) setSecondaryId(migratedSecondary);
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem("weather-primary-city", primaryId);
  }, [primaryId]);

  useEffect(() => {
    window.localStorage.setItem("weather-secondary-city", secondaryId);
  }, [secondaryId]);

  useEffect(() => {
    let cancelled = false;
    const getWeather = async () => {
      const response = await fetch(openMeteoUrl(), { cache: "no-store" });
      if (!response.ok) throw new Error("weather source unavailable");
      return normalizeOpenMeteo(await response.json());
    };

    Promise.all([
      getWeather(),
      fetch(`${ALERTS_URL}?refresh=${refreshKey}`, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("alerts unavailable");
        return response.json() as Promise<AlertsResponse>;
      }).catch(() => ({
        available: false,
        activeTyphoon: false,
        statusText: "官方資料暫時無法取得",
        typhoonItems: [],
        alerts: [],
        fetchedAt: new Date().toISOString(),
      } satisfies AlertsResponse)),
    ])
      .then(([weatherData, alertData]) => {
        if (cancelled) return;
        setWeather(weatherData);
        setAlerts(alertData);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setWeather(buildOfflineWeather());
        setError("即時資料暫時連不上，畫面目前顯示離線範例；稍後可再重新整理。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const weatherById = useMemo(
    () => new Map([...(weather?.locations ?? []), ...customWeather].map((location) => [location.cityId, location])),
    [weather, customWeather],
  );

  const primaryPlace = allPlaces.find((place) => place.id === primaryId) ?? FEATURED_PLACES[0];
  const secondaryPlace = allPlaces.find((place) => place.id === secondaryId) ?? FEATURED_PLACES[1];
  const primary = weatherById.get(primaryId);
  const secondary = weatherById.get(secondaryId);
  const decision = primary ? getUmbrellaDecision(primary) : null;
  const hourly = primary ? getHourSlice(primary, 9) : [];
  const eveningRisk = primary ? windowRisk(primary, 16, 19) : 0;
  const morningRisk = primary ? windowRisk(primary, 7, 9) : 0;
  const lunchRisk = primary ? windowRisk(primary, 11, 14) : 0;
  const overviewCities = regionFilter === "全部" ? CITIES : CITIES.filter((city) => city.region === regionFilter);
  const primaryHours = primary ? getHourSlice(primary, 12) : [];
  const maxGust = Math.max(...primaryHours.map((hour) => hour.gust), 0);
  const todayUv = primary?.daily.uv_index_max[0] ?? 0;
  const preparationItems = primary && decision ? [
    {
      icon: "umbrella" as IconName,
      title: decision.level === "safe" ? "雨具可輕裝" : decision.level === "required" ? "雨具一定要帶" : "帶把折疊傘",
      detail: decision.detail,
      tone: decision.level,
    },
    {
      icon: "temperature" as IconName,
      title: primary.current.apparent_temperature >= 35 ? "體感偏熱，注意補水" : "體感溫度尚可",
      detail: todayUv >= 8 ? `今日紫外線指數最高約 ${round(todayUv)}，中午外出建議防曬。` : `目前體感 ${round(primary.current.apparent_temperature)}°C，依行程準備即可。`,
      tone: todayUv >= 8 || primary.current.apparent_temperature >= 35 ? "recommended" : "safe",
    },
    {
      icon: "wind" as IconName,
      title: maxGust >= 40 ? "陣風較強，固定隨身物品" : "風勢大致平穩",
      detail: `未來 12 小時最大陣風約 ${round(maxGust)} km/h${maxGust >= 40 ? "，騎車請放慢速度。" : "。"}`,
      tone: maxGust >= 40 ? "required" : "safe",
    },
  ] : [];

  const updatedTime = weather?.fetchedAt
    ? new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(weather.fetchedAt))
    : "--:--";
  const alertsUpdatedTime = alerts?.fetchedAt && new Date(alerts.fetchedAt).getFullYear() > 1970
    ? new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(alerts.fetchedAt))
    : "等待首次自動同步";

  const changePrimary = useCallback((value: string) => {
    if (!value) return;
    setPrimaryId(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const viewDistrict = async () => {
    const city = CITIES.find((item) => item.id === browseCityId);
    if (!city || !browseDistrictName) return;
    const featured = findFeaturedPlace(browseCityId, browseDistrictName);
    if (featured) {
      setDistrictNotice(`${featured.cityName}${featured.name}已切換為主要地區。`);
      changePrimary(featured.id);
      return;
    }

    const id = districtPlaceId(browseCityId, browseDistrictName);
    if (weatherById.has(id)) {
      setDistrictNotice(`${city.name}${browseDistrictName}已切換為主要地區。`);
      changePrimary(id);
      return;
    }

    setSelectingDistrict(true);
    setDistrictNotice(`正在讀取${city.name}${browseDistrictName}的細部預報…`);
    try {
      const coordinates = getDistrictCoordinates(city.name, browseDistrictName);
      if (!coordinates) throw new Error("district coordinates unavailable");
      const place: Place = {
        id,
        name: browseDistrictName,
        shortName: browseDistrictName,
        cityId: city.id,
        cityName: city.name,
        region: city.region,
        latitude: coordinates[0],
        longitude: coordinates[1],
      };
      const response = await fetch(openMeteoLocationUrl(place.latitude, place.longitude), { cache: "no-store" });
      if (!response.ok) throw new Error("district weather unavailable");
      const payload = await response.json() as Omit<WeatherLocation, "cityId">;
      const location: WeatherLocation = { ...payload, cityId: place.id };
      setCustomPlaces((places) => [...places.filter((item) => item.id !== place.id), place]);
      setCustomWeather((locations) => [...locations.filter((item) => item.cityId !== location.cityId), location]);
      setDistrictNotice(`${city.name}${browseDistrictName}細部預報已載入。`);
      setPrimaryId(place.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setDistrictNotice("這個地區的細部預報暫時讀不到，請稍後再試。");
    } finally {
      setSelectingDistrict(false);
    }
  };

  const openCityDistricts = (cityId: string) => {
    setBrowseCityId(cityId);
    setBrowseDistrictName(DISTRICTS_BY_CITY[cityId]?.[0] ?? "");
    document.getElementById("districts")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const refreshWeather = () => {
    setLoading(true);
    setError("");
    setRefreshKey((key) => key + 1);
  };

  const swapCities = () => {
    setPrimaryId(secondaryId);
    setSecondaryId(primaryId);
  };

  const useNearestCity = () => {
    if (!navigator.geolocation) {
      setError("這個瀏覽器無法取得位置，請改用地區選單。");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = STATIC_PLACES.reduce((best, place) => {
          const distance = Math.hypot(place.latitude - coords.latitude, place.longitude - coords.longitude);
          return distance < best.distance ? { place, distance } : best;
        }, { place: FEATURED_PLACES[0], distance: Number.POSITIVE_INFINITY });
        setPrimaryId(nearest.place.id);
        setLocating(false);
      },
      () => {
        setError("無法取得目前位置，請確認瀏覽器定位權限，或直接選擇縣市與鄉鎮市區。");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#today" aria-label="天氣行動站首頁">
            <span className="brand-mark"><Icon name="cloud-sun" size={34} /></span>
            <span>天氣行動站</span>
          </a>
          <nav className="main-nav" aria-label="主要導覽">
            <a className="active" href="#today">今日</a>
            <a href="#favorites">常用地點</a>
            <a href="#districts">鄉鎮市區</a>
            <a href="#taiwan">全台總覽</a>
          </nav>
          <div className="header-actions">
            <PlaceSelect value={primaryId} onChange={changePrimary} label="選擇主要地區" places={allPlaces} />
            <span className="updated-label">更新 {updatedTime}</span>
            <ThemeSwitcher value={themePreference} onChange={setThemePreference} />
            <button className="icon-button" type="button" onClick={refreshWeather} aria-label="重新整理天氣" title="重新整理">
              <Icon name="refresh" size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="page-container" id="today">
        {error && (
          <div className="notice-banner" role="status">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="關閉提示">×</button>
          </div>
        )}

        <section className="context-row" aria-label="今日出門摘要">
          <div>
            <p className="eyebrow">今日行動摘要</p>
            <h1>{primaryPlace.shortName}出門前，先看這一眼</h1>
          </div>
          <button className="locate-button" type="button" onClick={useNearestCity} disabled={locating}>
            <Icon name="navigation" size={18} />
            {locating ? "定位中…" : "切換到最近地點"}
          </button>
        </section>

        <section className="favorite-section weather-card" id="favorites" aria-labelledby="favorites-title">
          <div className="favorite-heading">
            <div>
              <p className="eyebrow">我的生活路線</p>
              <h2 id="favorites-title">上班、返家與假日去處，一次比較</h2>
            </div>
            <p>點一下地點，下方就會切換成該區完整預報</p>
          </div>
          <div className="favorite-grid">
            {FEATURED_PLACES.map((place) => {
              const location = weatherById.get(place.id);
              const placeDecision = location ? getUmbrellaDecision(location) : null;
              return (
                <button
                  className={`favorite-card ${primaryId === place.id ? "active" : ""}`}
                  type="button"
                  key={place.id}
                  onClick={() => changePrimary(place.id)}
                  aria-pressed={primaryId === place.id}
                >
                  <span className="favorite-card-top">
                    <span className="place-role">{place.role}</span>
                    <small>{place.cityName}</small>
                  </span>
                  <span className="favorite-place-name"><Icon name="pin" size={17} /><b>{place.name}</b></span>
                  {location && placeDecision ? (
                    <>
                      <span className="favorite-condition">
                        <WeatherIcon code={location.current.weather_code} size={35} />
                        <strong>{round(location.current.temperature_2m)}°</strong>
                        <small>{describeWeather(location.current.weather_code)}</small>
                      </span>
                      <span className="favorite-rain">
                        <span><Icon name="droplet" size={14} />3 小時 {placeDecision.maxThree}%</span>
                        <b className={`mini-status ${placeDecision.level}`}>{placeDecision.level === "safe" ? "可不帶傘" : placeDecision.level === "required" ? "要帶傘" : "建議帶傘"}</b>
                      </span>
                    </>
                  ) : <span className="favorite-loading">整理預報中…</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="district-picker weather-card" id="districts" aria-labelledby="districts-title" aria-busy={selectingDistrict}>
          <div className="district-picker-copy">
            <p className="eyebrow">全台細部查詢</p>
            <h2 id="districts-title">想去哪一區？先把當地天氣調出來</h2>
            <p>先選縣市，再選鄉鎮市區；會顯示該地逐時降雨、帶傘建議與七日預報。</p>
          </div>
          <div className="district-picker-action">
            <div className="district-controls">
              <label>
                <span>縣市</span>
                <select data-testid="city-picker" aria-label="選擇縣市" value={browseCityId} onChange={(event) => {
                  const cityId = event.target.value;
                  setBrowseCityId(cityId);
                  setBrowseDistrictName(DISTRICTS_BY_CITY[cityId]?.[0] ?? "");
                }}>
                  {CITIES.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </label>
              <span className="picker-arrow" aria-hidden="true">→</span>
              <label>
                <span>鄉鎮市區</span>
                <select data-testid="district-picker" aria-label="選擇鄉鎮市區" value={browseDistrictName} onChange={(event) => setBrowseDistrictName(event.target.value)}>
                  {(DISTRICTS_BY_CITY[browseCityId] ?? []).map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </label>
              <button data-testid="district-submit" type="button" onClick={viewDistrict} disabled={selectingDistrict}>
                {selectingDistrict ? "讀取中…" : "查看這裡"}<Icon name="arrow" size={18} />
              </button>
            </div>
            <p className="district-notice" role="status">{districtNotice}</p>
          </div>
        </section>

        <section className="first-grid" aria-label="主要天氣資訊">
          <div className="left-stack">
            {loading || !primary || !decision ? <LoadingCard /> : (
              <article className={`primary-card weather-card decision-${decision.level}`}>
                <div className="card-heading-row">
                  <div className="location-title">
                    <Icon name="pin" size={24} />
                    <div>
                      <span className="card-kicker">主要地區</span>
                      <h2>{fullPlaceName(primaryPlace)}</h2>
                    </div>
                  </div>
                  <span className="freshness"><span className="live-dot" />即時預報</span>
                </div>

                <div className="decision-block">
                  <div className="umbrella-badge"><Icon name="umbrella" size={70} /><span>✓</span></div>
                  <div className="decision-copy">
                    <p className="decision-label">出門建議</p>
                    <h3>{decision.headline}</h3>
                    <p>{decision.detail}</p>
                  </div>
                </div>

                <div className="current-weather-row">
                  <div className="current-condition">
                    <WeatherIcon code={primary.current.weather_code} />
                    <div><span>目前</span><strong>{round(primary.current.temperature_2m)}°</strong><small>{describeWeather(primary.current.weather_code)}</small></div>
                  </div>
                  <dl className="current-metrics">
                    <div><dt>體感</dt><dd>{round(primary.current.apparent_temperature)}°C</dd></div>
                    <div><dt>濕度</dt><dd>{round(primary.current.relative_humidity_2m)}%</dd></div>
                    <div><dt>風速</dt><dd>{round(primary.current.wind_speed_10m)} km/h</dd></div>
                  </dl>
                </div>

                <div className="quick-facts">
                  <span><Icon name="droplet" size={17} />3 小時最高 {decision.maxThree}%</span>
                  <span><Icon name="clock" size={17} />{nextRainWindow(primary)}</span>
                  <span><Icon name="wind" size={17} />下班時段 {eveningRisk}%</span>
                </div>
              </article>
            )}

            <article className="hourly-card weather-card" id="hourly">
              <div className="section-heading">
                <div>
                  <p className="eyebrow"><Icon name="droplet" size={17} />逐時降雨機率</p>
                  <h2>哪個時間最可能下雨？</h2>
                </div>
                <span className="section-note">未來 9 小時</span>
              </div>

              {hourly.length ? (
                <div className="rain-chart" role="img" aria-label={`${fullPlaceName(primaryPlace)}未來九小時降雨機率`}>
                  {hourly.map((hour, index) => (
                    <div className={`rain-column ${hour.probability >= 60 ? "high" : hour.probability >= 40 ? "medium" : ""}`} key={hour.time} title={`${hourLabel(hour.time)}，降雨 ${round(hour.probability)}%，預估雨量 ${hour.precipitation} mm`}>
                      <strong>{round(hour.probability)}%</strong>
                      <div className="rain-track"><span style={{ height: `${Math.max(8, hour.probability)}%` }} /></div>
                      <time dateTime={hour.time}>{index === 0 ? "現在" : hourLabel(hour.time)}</time>
                    </div>
                  ))}
                </div>
              ) : <div className="chart-placeholder">天氣資料載入中…</div>}

              <div className="commute-strip">
                <div className="commute-icon"><Icon name="navigation" size={26} /></div>
                <div>
                  <span>通勤建議</span>
                  <strong>{riskAdvice(eveningRisk)}</strong>
                  <p>下班 16:00–19:00 最高降雨機率 {eveningRisk}%，出發前可再按一次更新。</p>
                </div>
              </div>
            </article>
          </div>

          <aside className="right-stack" aria-label="第二地區與颱風資訊">
            <article className="secondary-card weather-card">
              <div className="card-heading-row compact">
                <div className="location-title">
                  <Icon name="pin" size={21} />
                  <div><span className="card-kicker">對照地區</span><h2>{fullPlaceName(secondaryPlace)}</h2></div>
                </div>
                <PlaceSelect value={secondaryId} onChange={setSecondaryId} label="選擇對照地區" places={[...FEATURED_PLACES, ...customPlaces]} />
              </div>
              {secondary ? (
                <>
                  <div className="secondary-summary">
                    <WeatherIcon code={secondary.current.weather_code} size={64} />
                    <div><strong>{describeWeather(secondary.current.weather_code)}</strong><p>{nextRainWindow(secondary)}</p></div>
                  </div>
                  <div className="secondary-stats">
                    <span><Icon name="temperature" size={24} /><b>{round(secondary.daily.temperature_2m_min[0])}–{round(secondary.daily.temperature_2m_max[0])}°C</b></span>
                    <span><Icon name="droplet" size={24} /><b>降雨 {round(secondary.daily.precipitation_probability_max[0])}%</b></span>
                  </div>
                </>
              ) : <div className="chart-placeholder small">載入中…</div>}
              <button className="swap-button" type="button" onClick={swapCities}><Icon name="swap" size={17} />交換主要與常用地區</button>
            </article>

            <article className={`typhoon-card weather-card ${alerts?.activeTyphoon ? "alerting" : ""}`} id="typhoon">
              <div className="typhoon-heading"><span className="typhoon-icon"><Icon name="typhoon" size={34} /></span><div><p className="eyebrow">颱風狀態</p><h2>{alerts?.available === false ? "官方資料暫時無法取得" : alerts?.statusText ?? "正在確認官方資訊"}</h2></div></div>
              <p className="typhoon-copy">
                {alerts?.activeTyphoon
                  ? "已有颱風或熱帶性低氣壓消息，請依氣象署最新路徑與警報安排交通。"
                  : "目前可維持日常安排；若有系統生成，這裡會切換為醒目提醒。"}
              </p>
              <a className="primary-action" href={CWA_TYPHOON_URL} target="_blank" rel="noreferrer">
                查看氣象署颱風動態 <Icon name="arrow" size={20} />
              </a>
              <small>氣象署資料每 10 分鐘自動同步 · {alertsUpdatedTime}</small>
            </article>

            <article className="commute-card weather-card">
              <div className="section-heading compact"><div><p className="eyebrow">三段行程</p><h2>今天怎麼準備</h2></div></div>
              <div className="trip-list">
                {[
                  { label: "早上通勤", time: "07–09", risk: morningRisk },
                  { label: "午間外出", time: "11–14", risk: lunchRisk },
                  { label: "下班返程", time: "16–19", risk: eveningRisk },
                ].map((trip) => (
                  <div className="trip-row" key={trip.label}>
                    <div><strong>{trip.label}</strong><span>{trip.time} 時</span></div>
                    <div className="risk-meter"><span style={{ width: `${trip.risk}%` }} /></div>
                    <b className={trip.risk >= 60 ? "risk-high" : ""}>{trip.risk}%</b>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>

        <section className="weekly-section weather-card" id="week">
          <div className="section-heading">
            <div><p className="eyebrow">一週天氣</p><h2>{fullPlaceName(primaryPlace)}未來 7 天</h2></div>
            <p className="section-note">切換常用地點或細部地區即可更新</p>
          </div>
          <div className="daily-grid">
            {primary?.daily.time.slice(0, 7).map((time, index) => (
              <article className={index === 0 ? "today" : ""} key={time}>
                <time dateTime={time}>{weekdayLabel(time, index)}</time>
                <WeatherIcon code={primary.daily.weather_code[index]} size={40} />
                <strong>{round(primary.daily.temperature_2m_max[index])}° <span>{round(primary.daily.temperature_2m_min[index])}°</span></strong>
                <small><Icon name="droplet" size={14} />{round(primary.daily.precipitation_probability_max[index])}%</small>
              </article>
            )) ?? Array.from({ length: 7 }, (_, index) => <article className="daily-loading" key={index} />)}
          </div>
        </section>

        <section className="preparation-section" aria-labelledby="preparation-title">
          <div className="section-heading outside-heading">
            <div><p className="eyebrow">其他準備</p><h2 id="preparation-title">除了雨傘，出門還要注意什麼？</h2></div>
            <p className="section-note">依 {fullPlaceName(primaryPlace)} 未來 12 小時預報整理</p>
          </div>
          <div className="preparation-grid">
            {preparationItems.map((item) => (
              <article className={`preparation-card weather-card tone-${item.tone}`} key={item.title}>
                <span className="preparation-icon"><Icon name={item.icon} size={25} /></span>
                <div><h3>{item.title}</h3><p>{item.detail}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="taiwan-section weather-card" id="taiwan" aria-labelledby="taiwan-title">
          <div className="section-heading taiwan-heading">
            <div><p className="eyebrow">全台快速掃描</p><h2 id="taiwan-title">台灣各地現在需不需要帶傘？</h2></div>
            <p className="section-note">點縣市後可接著挑選鄉鎮市區</p>
          </div>
          <div className="region-tabs" role="group" aria-label="篩選台灣地區">
            {REGIONS.map((region) => (
              <button className={regionFilter === region ? "active" : ""} type="button" key={region} onClick={() => setRegionFilter(region)} aria-pressed={regionFilter === region}>
                {region}
              </button>
            ))}
          </div>
          <div className="city-overview-grid">
            {overviewCities.map((city) => {
              const location = weatherById.get(city.id);
              const cityDecision = location ? getUmbrellaDecision(location) : null;
              return (
                <button className={`city-overview-card ${primaryPlace.cityId === city.id ? "selected" : ""}`} type="button" key={city.id} onClick={() => openCityDistricts(city.id)}>
                  <span className="city-overview-top"><b>{city.name}</b><small>{city.region}</small></span>
                  {location && cityDecision ? (
                    <>
                      <span className="city-weather-line"><WeatherIcon code={location.current.weather_code} size={35} /><strong>{round(location.current.temperature_2m)}°</strong><em>{describeWeather(location.current.weather_code)}</em></span>
                      <span className="city-rain-line"><span><Icon name="droplet" size={14} />3 小時 {cityDecision.maxThree}%</span><b className={`mini-status ${cityDecision.level}`}>{cityDecision.level === "safe" ? "可不帶傘" : cityDecision.level === "required" ? "要帶傘" : "建議帶傘"}</b></span>
                    </>
                  ) : <span className="city-loading">載入中…</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="official-section" aria-labelledby="official-title">
          <article className="official-alerts weather-card">
            <div className="section-heading">
              <div><p className="eyebrow">官方警特報</p><h2 id="official-title">中央氣象署最新提醒</h2></div>
              <a className="text-link" href={CWA_HOME_URL} target="_blank" rel="noreferrer">前往氣象署 <Icon name="external" size={15} /></a>
            </div>
            {alerts?.available && alerts.alerts.length ? (
              <div className="alert-list">
                {alerts.alerts.slice(0, 4).map((item) => (
                  <a href={item.link || CWA_HOME_URL} target="_blank" rel="noreferrer" key={`${item.title}-${item.publishedAt ?? ""}`}>
                    <span className="alert-dot" />
                    <span><strong>{item.title}</strong><small>{item.description || "點擊查看氣象署完整內容"}</small></span>
                    <Icon name="arrow" size={17} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="official-empty">
                <span className="typhoon-icon"><Icon name="cloud-sun" size={31} /></span>
                <div><strong>{alerts?.available === false ? "暫時無法同步官方警特報" : "目前沒有需要特別顯示的警特報"}</strong><p>網站仍會持續顯示逐時預報；重要決策請再查看中央氣象署。</p></div>
              </div>
            )}
          </article>

          <article className={`typhoon-detail weather-card ${alerts?.activeTyphoon ? "alerting" : ""}`}>
            <div className="typhoon-detail-top">
              <span className="typhoon-icon"><Icon name="typhoon" size={34} /></span>
              <div><p className="eyebrow">颱風監測</p><h2>{alerts?.statusText ?? "正在確認官方資訊"}</h2></div>
            </div>
            {alerts?.typhoonItems.length ? (
              <div className="typhoon-news">
                {alerts.typhoonItems.slice(0, 2).map((item) => <a href={item.link || CWA_TYPHOON_URL} target="_blank" rel="noreferrer" key={item.title}>{item.title}<Icon name="external" size={15} /></a>)}
              </div>
            ) : <p>若西北太平洋或南海有颱風、熱帶性低氣壓生成，請從官方頁面確認路徑、暴風圈與更新時間。</p>}
            <a className="primary-action" href={CWA_TYPHOON_URL} target="_blank" rel="noreferrer">查看颱風路徑與動態 <Icon name="arrow" size={20} /></a>
          </article>
        </section>

        <footer className="site-footer">
          <p>天氣預報由 Open-Meteo 提供，行政區位置參考內政部公開界線資料；颱風與警特報以中央氣象署發布為準。</p>
          <p>降雨機率是預報參考，局部短延時強降雨仍可能突然發生。</p>
        </footer>
      </main>
    </div>
  );
}
