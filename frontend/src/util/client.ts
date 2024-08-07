import { Axios } from "axios";

export class Client {
    public _axios: Axios;
    public characters: ClientCharacters;
    public words: ClientWords;
    public convert: ClientConvert;
    public admin: ClientAdmin;

    constructor(baseUrl: string, token?: string) {
        this._axios = new Axios({
            baseURL: baseUrl,
            headers: token ? { "x-session-token": token } : {},
            validateStatus: status => status >= 200 && status < 300,
            transformRequest: (data, headers) => {
                if (data == null) return null;
                headers["Content-Type"] = "application/json";
                return JSON.stringify(data);
            },
            transformResponse: (data, headers) => {
                if (data == null || data == "") return null;
                return JSON.parse(data);
            },
        });
        this.characters = new ClientCharacters(this);
        this.words = new ClientWords(this);
        this.convert = new ClientConvert(this);
        this.admin = new ClientAdmin(this);
    }

    async makeFont() {
        await this._axios.get("/make-font");
    }
}

export class ClientCharacters {
    public client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async getAll(): Promise<Character[]> {
        return (await this.client._axios.get("/characters")).data;
    }

    async get(id: string): Promise<Character> {
        return (await this.client._axios.get("/characters/" + id)).data;
    }

    async post(character: Character): Promise<Character> {
        return (await this.client._axios.post("/characters", character)).data;
    }

    async patch(character: Partial<Character>) {
        await this.client._axios.patch("/characters", character);
    }
}

export class ClientWords {
    public client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async getAll(): Promise<Word[]> {
        return (await this.client._axios.get("/words")).data;
    }

    async getAllWithText(): Promise<WordWithText[]> {
        return (await this.client._axios.get("/words/withText")).data;
    }

    async get(id: string): Promise<Word> {
        return (await this.client._axios.get("/words/" + id)).data;
    }

    async getWithText(id: string): Promise<WordWithText> {
        return (await this.client._axios.get("/words/" + id + "/withText")).data;
    }

    async post(word: Word): Promise<Word> {
        return (await this.client._axios.post("/words", word)).data;
    }

    async patch(word: Partial<Word>) {
        await this.client._axios.patch("/words", word);
    }
}

export class ClientConvert {
    public client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async to(text: string, signal?: AbortSignal): Promise<ConvertResponse> {
        return (await this.client._axios.post("/convert/to", { text }, {
            signal: signal,
        })).data
    }

    async from(text: string, signal?: AbortSignal): Promise<ConvertResponse> {
        return (await this.client._axios.post("/convert/from", { text }, {
            signal: signal,
        })).data
    }
}

export class ClientAdmin {
    public client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async derivedWords() {
        return this.client._axios.get("/admin/derived-words")
    }
}

export type ConvertResponse = {
    text: string
};

export type Character = {
    _id: string
    makeInfo: CharacterMakeInfo
};

export type CharacterMakeInfo = {
    name: string
    parts?: CharacterMakePart[]
    // hex without '0x' prefix, should ideally be padded on the left with '0' to 5 characters
    code?: string
};

export type CharacterMakePart = {
    type: string
    parts?: CharacterMakePart[]
    character?: string
    move?: number[]
    multiply?: number[]
};

export type Word = {
    _id: string
    characters: string[]
    words: WordForm[]
    derivedFrom?: string
    derivedName?: string
};

export type WordForm = {
    text: string
    tags?: string[]
    etymologyNumber?: number
};

export type WordWithText = Word & {
    text: string
};

export type Report = {
    madeCharacters: { [key: string]: string }
    failedCharacters: string[]
}

export type Partial<T> = {
    [Property in keyof T]?: T[Property]
}