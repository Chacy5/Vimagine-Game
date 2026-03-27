import { useEffect, useMemo, useState } from "react";
import plantIcon from "./assets/icons/plant.svg";
import consoleIcon from "./assets/icons/console.svg";
import mugIcon from "./assets/icons/mug.svg";
import plushIcon from "./assets/icons/plush.svg";
import tasksIcon from "./assets/icons/tasks.svg";
import storyIcon from "./assets/icons/story.svg";
import profileIcon from "./assets/icons/profile.svg";
import bookIcon from "./assets/icons/book.svg";
import battleIcon from "./assets/icons/battle.svg";
import npcIcon from "./assets/icons/npc.svg";
import shopIcon from "./assets/icons/shop.svg";

type TaskItem = {
  id: string;
  title: string;
  note: string;
  done: boolean;
};

type ProfileForm = {
  gender: string;
  hair: string;
  eyes: string;
  description: string;
};

type ProfileVariant = {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  level: string;
};

type ProfileVariantPayload = Omit<ProfileVariant, "id">;

const initialTasks: TaskItem[] = [
  {
    id: "seed-1",
    title: "Написать код для магазина пива",
    note: "Мир Dota 2: Брумастер и КМ ищут идеальную таверну",
    done: false
  },
  {
    id: "seed-2",
    title: "Сделать планер на неделю",
    note: "Мир Ghibli: тихий городок и добрые духи",
    done: false
  },
  {
    id: "seed-3",
    title: "Разобрать входящие",
    note: "Кибер-доудзин: неон и кофе ночью",
    done: false
  }
];

type StoryCard = {
  title: string;
  text: string;
};

const initialStoryCards: StoryCard[] = [
  {
    title: "Врата Сакуры",
    text: "Вы открываете портал, и лепестки показывают путь к первому квесту."
  },
  {
    title: "Таверна Брумастера",
    text: "Нужно поднять сервис для учета бочек и ускорить доставку."
  },
  {
    title: "Код как магия",
    text: "Каждая строка кода превращается в заклинание поддержки команды."
  }
];

const npcs = [
  {
    name: "Хранитель лент",
    role: "Помогает не терять фокус"
  },
  {
    name: "Саппорт-кицунэ",
    role: "Подсказывает, когда пора отдыхать"
  },
  {
    name: "Торговец бусин",
    role: "Меняет монетки на редкие темы"
  }
];

const shopItems = [
  {
    name: "Пастельная тема",
    price: 120
  },
  {
    name: "Эмодзи-набор",
    price: 80
  },
  {
    name: "Анимация карточек",
    price: 200
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [storyInput, setStoryInput] = useState("");
  const [storyCards, setStoryCards] = useState<StoryCard[]>(initialStoryCards);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(() => {
    const saved = localStorage.getItem("vimagine_profile_form");
    if (saved) {
      try {
        return JSON.parse(saved) as ProfileForm;
      } catch {
        return {
          gender: "Девушка",
          hair: "",
          eyes: "",
          description: ""
        };
      }
    }
    return {
      gender: "Девушка",
      hair: "",
      eyes: "",
      description: ""
    };
  });
  const [profileVariants, setProfileVariants] = useState<ProfileVariant[]>(() => {
    const saved = localStorage.getItem("vimagine_profile_variants");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as ProfileVariant[];
    } catch {
      return [];
    }
  });
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    return localStorage.getItem("vimagine_profile_selected");
  });
  const [profileIsGenerating, setProfileIsGenerating] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [taskItems, setTaskItems] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("vimagine_tasks");
    if (!saved) return initialTasks;
    try {
      return JSON.parse(saved) as TaskItem[];
    } catch {
      return initialTasks;
    }
  });
  const tabTitle = useMemo(() => {
    const titles: Record<string, string> = {
      tasks: "Задачи",
      story: "История",
      profile: "Профиль",
      log: "Книга",
      battle: "Батл-пасс",
      npc: "NPC",
      shop: "Магазин"
    };

    return titles[activeTab] ?? "";
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("vimagine_tasks", JSON.stringify(taskItems));
  }, [taskItems]);

  useEffect(() => {
    localStorage.setItem("vimagine_profile_form", JSON.stringify(profileForm));
  }, [profileForm]);

  useEffect(() => {
    localStorage.setItem(
      "vimagine_profile_variants",
      JSON.stringify(profileVariants)
    );
  }, [profileVariants]);

  useEffect(() => {
    if (selectedVariantId) {
      localStorage.setItem("vimagine_profile_selected", selectedVariantId);
    }
  }, [selectedVariantId]);

  const addTask = () => {
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle) return;
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      note: taskNote.trim(),
      done: false
    };
    setTaskItems((prev) => [newTask, ...prev]);
    setTaskTitle("");
    setTaskNote("");
  };

  const toggleTask = (id: string) => {
    setTaskItems((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTaskItems((prev) => prev.filter((task) => task.id !== id));
  };

  const callGroq = async (prompt: string) => {
    const response = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        prompt
      })
    });

    const data = (await response.json()) as { content?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Groq API не отвечает.");
    }
    return data.content ?? "";
  };

  const generateCharacterVariants = () => {
    const baseNames =
      profileForm.gender === "Парень"
        ? ["Хару", "Рен", "Сора", "Кай", "Аки"]
        : profileForm.gender === "Небинарный"
          ? ["Юки", "Рио", "Аои", "Ран", "Сей"]
          : ["Юми", "Сая", "Мио", "Ая", "Рина"];

    const roles = ["Странник", "Хранитель", "Алхимик", "Навигатор", "Художник"];
    const vibes = [
      "тёплый",
      "мечтательный",
      "смелый",
      "спокойный",
      "искрящийся"
    ];

    const variants = Array.from({ length: 3 }).map(() => {
      const name = baseNames[Math.floor(Math.random() * baseNames.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const vibe = vibes[Math.floor(Math.random() * vibes.length)];
      const description = profileForm.description.trim();
      const hair = profileForm.hair.trim() || "пастельные волосы";
      const eyes = profileForm.eyes.trim() || "светлые глаза";

      const summary = description
        ? description
        : `${vibe} герой с ${hair} и ${eyes}, готовый помочь любому миру.`;

      return {
        id: crypto.randomUUID(),
        name: `${name} ${role}`,
        tagline: `${vibe} вайб`,
        summary,
        level: `Lv. ${12 + Math.floor(Math.random() * 10)} ${role}`
      } as ProfileVariant;
    });

    setProfileVariants(variants);
    setSelectedVariantId(variants[0]?.id ?? null);
  };

  const parseProfileVariants = (text: string): ProfileVariant[] => {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const jsonSlice = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;
    try {
      const parsed = JSON.parse(jsonSlice) as ProfileVariantPayload[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.slice(0, 3).map((item) => ({
          id: crypto.randomUUID(),
          name: item.name || "Без имени",
          tagline: item.tagline || "",
          summary: item.summary || "",
          level: item.level || "Lv. 1"
        }));
      }
    } catch {
      // fall through
    }
    return [];
  };

  const generateCharacterWithAI = async () => {
    setProfileIsGenerating(true);
    setProfileError(null);
    const prompt = `Ты создаешь варианты главного героя для милой игры-планера.\n` +
      `Сделай 3 варианта. Каждый вариант: name, tagline, summary, level.\n` +
      `Пол: ${profileForm.gender}.\n` +
      `Волосы: ${profileForm.hair || "не указано"}.\n` +
      `Глаза: ${profileForm.eyes || "не указано"}.\n` +
      `Описание: ${profileForm.description || "не указано"}.\n` +
      `Стиль: каваии, пиксельный, уютный.\n` +
      `Ответ верни строго JSON-массивом объектов {"name":"...","tagline":"...","summary":"...","level":"..."}.`;

    try {
      const raw = await callGroq(prompt);
      const variants = parseProfileVariants(raw);
      if (variants.length === 0) {
        throw new Error("Модель вернула неполный ответ. Попробуй снова.");
      }
      setProfileVariants(variants);
      setSelectedVariantId(variants[0]?.id ?? null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось получить ответ от модели.";
      setProfileError(message);
    } finally {
      setProfileIsGenerating(false);
    }
  };

  const activeHero =
    profileVariants.find((variant) => variant.id === selectedVariantId) ?? {
      id: "default",
      name: "Pinekid",
      tagline: "тихий вайб",
      summary: "Главный герой всех приключений и хранитель артефактов.",
      level: "Lv. 18 Artist"
    };

  const parseStoryCards = (text: string): StoryCard[] => {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const jsonSlice = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;
    try {
      const parsed = JSON.parse(jsonSlice) as StoryCard[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.slice(0, 5);
      }
    } catch {
      // fall through
    }
    return [
      {
        title: "Приключение",
        text: text.trim() || "Модель не вернула текст."
      }
    ];
  };

  const generateAdventure = async () => {
    setActiveTab("story");
    setIsGenerating(true);
    setStoryError(null);
    const pendingTasks = taskItems.filter((task) => !task.done);
    const taskList = pendingTasks.length
      ? pendingTasks
          .slice(0, 5)
          .map((task) => `- ${task.title}${task.note ? ` (${task.note})` : ""}`)
          .join("\n")
      : "- Задач пока нет";

    const prompt = `Ты — сценарист милого японского приключения в пиксельном стиле.\n` +
      `Сделай 4 карточки истории. Каждая карточка: короткое название и 1-2 предложения.\n` +
      `Стиль: ${storyInput || "каваии, тёплый, пастельный"}.\n` +
      `Задачи игрока:\n${taskList}\n` +
      `Ответ верни строго JSON-массивом объектов вида {"title":"...","text":"..."}.`;

    try {
      const raw = await callGroq(prompt);
      setStoryCards(parseStoryCards(raw));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось получить ответ от модели.";
      setStoryError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app">
      <div className="bg-orbit" />
      <div className="layout">
        <nav className="side-tabs" aria-label="Основные вкладки">
          <button
            className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <img src={tasksIcon} alt="Задачи" />
            <span>Задачи</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "story" ? "active" : ""}`}
            onClick={() => setActiveTab("story")}
          >
            <img src={storyIcon} alt="История" />
            <span>История</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <img src={profileIcon} alt="Профиль" />
            <span>Профиль</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "log" ? "active" : ""}`}
            onClick={() => setActiveTab("log")}
          >
            <img src={bookIcon} alt="Книга" />
            <span>Книга</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "battle" ? "active" : ""}`}
            onClick={() => setActiveTab("battle")}
          >
            <img src={battleIcon} alt="Батл-пасс" />
            <span>Батл</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "npc" ? "active" : ""}`}
            onClick={() => setActiveTab("npc")}
          >
            <img src={npcIcon} alt="NPC" />
            <span>NPC</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "shop" ? "active" : ""}`}
            onClick={() => setActiveTab("shop")}
          >
            <img src={shopIcon} alt="Магазин" />
            <span>Шоп</span>
          </button>
        </nav>

        <div className="screen">
          <header className="hero hud">
            <div className="hero-badge">Vimagine</div>
            <div className="hud-card">
              <div className="hud-avatar" aria-hidden />
              <div className="hud-info">
                <div className="hud-title">
                  <span className="hud-name">{activeHero.name}</span>
                  <span className="hud-level">{activeHero.level}</span>
                </div>
                <h1>{tabTitle}</h1>
                <div className="hud-bars">
                  <div className="hud-bar">
                    <span>HP</span>
                    <div className="bar-track">
                      <div className="bar-fill hp" />
                    </div>
                  </div>
                  <div className="hud-bar">
                    <span>PP</span>
                    <div className="bar-track">
                      <div className="bar-fill pp" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="hud-inventory" aria-label="Инвентарь">
                <div className="inv-slot">
                  <img src={plantIcon} alt="Росток" />
                </div>
                <div className="inv-slot">
                  <img src={consoleIcon} alt="Консоль" />
                </div>
                <div className="inv-slot">
                  <img src={mugIcon} alt="Чашка" />
                </div>
                <div className="inv-slot">
                  <img src={plushIcon} alt="Плюш" />
                </div>
              </div>
            </div>
          </header>

          <main className="content single">
            {activeTab === "tasks" && (
              <section className="section">
                <div className="section-header">
                  <h2>Список задач</h2>
                  <button className="btn ghost" onClick={addTask}>
                    Добавить
                  </button>
                </div>
                <div className="task-form">
                  <input
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Название задачи"
                  />
                  <input
                    value={taskNote}
                    onChange={(event) => setTaskNote(event.target.value)}
                    placeholder="Контекст приключения"
                  />
                </div>
                <div className="card-grid">
                  {taskItems.map((task) => (
                    <article
                      key={task.id}
                      className={`task-card ${task.done ? "is-done" : ""}`}
                    >
                      <h3>{task.title}</h3>
                      <p>{task.note || "Без контекста"}</p>
                      <div className="task-actions">
                        <button
                          className="chip"
                          onClick={() => toggleTask(task.id)}
                        >
                          {task.done ? "Вернуть" : "Выполнено"}
                        </button>
                        <button
                          className="chip danger"
                          onClick={() => deleteTask(task.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "story" && (
              <section className="section">
                <div className="section-header">
                  <h2>Концепция приключения</h2>
                  <button className="btn primary" onClick={generateAdventure}>
                    {isGenerating ? "Генерация..." : "Сгенерировать"}
                  </button>
                </div>
                <div className="story-panel">
                  <textarea
                    placeholder="Опишите стиль истории и атмосферу вашего приключения..."
                    value={storyInput}
                    onChange={(event) => setStoryInput(event.target.value)}
                  />
                  {storyError && (
                    <p className="story-status error">{storyError}</p>
                  )}
                  <div className="story-cards">
                    {storyCards.map((card) => (
                      <article key={card.title} className="story-card">
                        <h3>{card.title}</h3>
                        <p>{card.text}</p>
                        <div className="story-actions">
                          <button className="btn ghost">Пропустить</button>
                          <button className="btn primary">Выполнено</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "profile" && (
              <section className="section">
                <div className="section-header">
                  <h2>Профиль героя</h2>
                  <button
                    className="btn primary"
                    onClick={generateCharacterWithAI}
                  >
                    {profileIsGenerating
                      ? "Генерация..."
                      : "Сгенерировать персонажа"}
                  </button>
                </div>
                <div className="profile-grid">
                  <div className="profile-form">
                    <label>
                      Пол
                      <select
                        value={profileForm.gender}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            gender: event.target.value
                          }))
                        }
                      >
                        <option>Девушка</option>
                        <option>Парень</option>
                        <option>Небинарный</option>
                      </select>
                    </label>
                    <label>
                      Цвет волос
                      <input
                        value={profileForm.hair}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            hair: event.target.value
                          }))
                        }
                        placeholder="Например, розовый"
                      />
                    </label>
                    <label>
                      Цвет глаз
                      <input
                        value={profileForm.eyes}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            eyes: event.target.value
                          }))
                        }
                        placeholder="Например, янтарный"
                      />
                    </label>
                    <label>
                      Опишите вашего персонажа
                      <textarea
                        value={profileForm.description}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            description: event.target.value
                          }))
                        }
                        placeholder="Хрупкий путешественник с магической катаной"
                      />
                    </label>
                    <div className="profile-actions">
                      <button
                        className="btn ghost"
                        onClick={generateCharacterVariants}
                      >
                        Обновить варианты без AI
                      </button>
                      {profileError && (
                        <p className="profile-status error">{profileError}</p>
                      )}
                    </div>
                  </div>
                  <div className="profile-preview">
                    <div className="preview-card">
                      <div className="avatar" />
                      <div>
                        <h3>{activeHero.name}</h3>
                        <p>{activeHero.summary}</p>
                        <div className="stats">
                          <span>{activeHero.level}</span>
                          <span>Монетки: 320</span>
                          <span>Энергия: 68%</span>
                        </div>
                      </div>
                    </div>
                    <div className="variant-grid">
                      {profileVariants.length === 0 && (
                        <div className="variant-empty">
                          Нажми «Сгенерировать персонажа», чтобы получить
                          варианты.
                        </div>
                      )}
                      {profileVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className={`variant-card ${
                            variant.id === selectedVariantId ? "active" : ""
                          }`}
                        >
                          <div>
                            <h4>{variant.name}</h4>
                            <p>{variant.tagline}</p>
                            <small>{variant.summary}</small>
                          </div>
                          <button
                            className="btn ghost"
                            onClick={() => setSelectedVariantId(variant.id)}
                          >
                            Выбрать
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="level-panel">
                      <h4>Левел-апы</h4>
                      <p>
                        Новые уровни открывают редкие локации и уникальные стили.
                      </p>
                      <button className="btn ghost">Просмотреть награды</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "log" && (
              <section className="section">
                <div className="section-header">
                  <h2>Книга приключений</h2>
                  <button className="btn ghost">Открыть архив</button>
                </div>
                <div className="book">
                  <div className="book-page left">
                    <h3>Глава 1</h3>
                    <p>Портал в мир сумерек и первое спасение.</p>
                  </div>
                  <div className="book-page right">
                    <h3>Глава 2</h3>
                    <p>Алхимия задач и новые союзники.</p>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "battle" && (
              <section className="section">
                <div className="section-header">
                  <h2>Ежемесячный батл-пасс</h2>
                  <button className="btn primary">Спросить вайб месяца</button>
                </div>
                <div className="battle-pass">
                  <div>
                    <h3>Март: Лепестки и кометы</h3>
                    <p>
                      Мини-версии героя бегают по дорожке наград и открывают новые
                      эмодзи.
                    </p>
                  </div>
                  <div className="battle-track">
                    <span className="node active">1</span>
                    <span className="node">2</span>
                    <span className="node">3</span>
                    <span className="node">4</span>
                    <span className="node">5</span>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "npc" && (
              <section className="section">
                <div className="section-header">
                  <h2>NPC и диалоги</h2>
                  <button className="btn ghost">Начать чат</button>
                </div>
                <div className="npc-grid">
                  {npcs.map((npc) => (
                    <article key={npc.name} className="npc-card">
                      <h3>{npc.name}</h3>
                      <p>{npc.role}</p>
                      <button className="btn ghost">Поговорить</button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "shop" && (
              <section className="section">
                <div className="section-header">
                  <h2>Магазин</h2>
                  <button className="btn primary">Пополнить монетки</button>
                </div>
                <div className="shop-grid">
                  {shopItems.map((item) => (
                    <article key={item.name} className="shop-card">
                      <h3>{item.name}</h3>
                      <p>Цена: {item.price}</p>
                      <button className="btn ghost">Купить</button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      <nav className="mobile-tabs" aria-label="Навигация">
        <button
          className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <img src={tasksIcon} alt="Задачи" />
          Задачи
        </button>
        <button
          className={`tab-btn ${activeTab === "story" ? "active" : ""}`}
          onClick={() => setActiveTab("story")}
        >
          <img src={storyIcon} alt="История" />
          История
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <img src={profileIcon} alt="Профиль" />
          Профиль
        </button>
        <button
          className={`tab-btn ${activeTab === "battle" ? "active" : ""}`}
          onClick={() => setActiveTab("battle")}
        >
          <img src={battleIcon} alt="Батл" />
          Батл
        </button>
        <button
          className={`tab-btn ${activeTab === "shop" ? "active" : ""}`}
          onClick={() => setActiveTab("shop")}
        >
          <img src={shopIcon} alt="Шоп" />
          Шоп
        </button>
      </nav>

      <div className="corner-actions" aria-label="Быстрые действия">
        <button className="btn ghost">Настройки</button>
        <button className="btn primary" onClick={generateAdventure}>
          {isGenerating ? "Генерация..." : "Сгенерировать приключение"}
        </button>
      </div>
    </div>
  );
}
