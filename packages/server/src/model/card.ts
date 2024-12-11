import { CourseLanguage } from "@wemorize/common/src/model/course";

interface CardDefinition {
    content: string
}

class CardQuestion {
    content: string;

    constructor(question: CardDefinition) {
        this.content = question.content;
    }
}

abstract class CardAnswer {
    content: string;

    constructor(answer: CardDefinition) {
        this.content = answer.content;
    }

    abstract getVariables(): object;
    abstract validateAnswer(input: string): boolean;
}

class SelftestCardAnswer extends CardAnswer {

    getVariables(): object {
        return {};
    }

    validateAnswer(input: string): boolean {
        return input === "self_assessment_correct";
    }
    
}

class InputCardAnswer extends CardAnswer {

    getVariables(): object {
        return {};
    }

    validateAnswer(input: string): boolean {
        return input.trim().toLowerCase() === this.content.trim().toLowerCase();
    }

}

class SimilarAlternativesAnswer extends CardAnswer {

    choices: string[];

    constructor(content: CardDefinition, alternatives: string[]) {
        super(content);
        this.choices = [content.content, ...alternatives];
        for(let i = this.choices.length; i > 0; i--) {
            const random = Math.floor(Math.random() * i);
            const tmp = this.choices[i] ?? "";
            this.choices[i] = this.choices[random - 1] ?? "";
            this.choices[random - 1] = tmp;
        }
    }

    getVariables(): object {
        return {
            choices: this.choices
        };
    }

    validateAnswer(input: string): boolean {
        const selected = Number(input);
        return selected < this.choices.length && this.choices[selected] === this.content;
    }

}

interface Card {
    id: number,
    course_language: CourseLanguage,
    question: CardQuestion,
    answer: CardAnswer,
    module: number,
    next_id: number|null,
    value: number
}

export {
    CardQuestion, SelftestCardAnswer, InputCardAnswer, SimilarAlternativesAnswer
}

export type {
    Card, CardAnswer
}