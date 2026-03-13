/**
 * Task: d445bcfa — Detect card components by identifying repeated container patterns
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectCards } from './detectCards.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('detectCards — detect card components via structural patterns', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => el.__fakeStyle__ ?? fakeStyle();
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function buildCard(parent, tag = 'div') {
    const card = document.createElement(tag);
    card.__fakeStyle__ = fakeStyle();

    const img = document.createElement('img');
    img.__fakeStyle__ = fakeStyle();
    card.appendChild(img);

    const text = document.createElement('p');
    text.__fakeStyle__ = fakeStyle();
    card.appendChild(text);

    const cta = document.createElement('button');
    cta.__fakeStyle__ = fakeStyle();
    card.appendChild(cta);

    parent.appendChild(card);
    return card;
  }

  test('returns an object with a cards array', () => {
    const result = detectCards();
    expect(result).toHaveProperty('cards');
    expect(Array.isArray(result.cards)).toBe(true);
  });

  test('detects a card group when 2+ sibling containers share image+text+action structure', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);
    buildCard(list, 'li');
    buildCard(list, 'li');

    const { cards } = detectCards();
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  test('each card group entry has instanceCount field', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);
    buildCard(list, 'li');
    buildCard(list, 'li');

    const { cards } = detectCards();
    expect(cards[0]).toHaveProperty('instanceCount');
    expect(cards[0].instanceCount).toBeGreaterThanOrEqual(2);
  });

  test('each card group entry has a tag field', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);
    buildCard(list, 'li');
    buildCard(list, 'li');

    const { cards } = detectCards();
    expect(cards[0]).toHaveProperty('tag');
  });

  test('each card group entry has a parentTag field', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);
    buildCard(list, 'li');
    buildCard(list, 'li');

    const { cards } = detectCards();
    expect(cards[0]).toHaveProperty('parentTag');
    expect(cards[0].parentTag).toBe('ul');
  });

  test('each card group entry has a hasImage field', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);
    buildCard(list, 'li');
    buildCard(list, 'li');

    const { cards } = detectCards();
    expect(cards[0]).toHaveProperty('hasImage');
    expect(cards[0].hasImage).toBe(true);
  });

  test('each card group entry has a hasAction field', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);
    buildCard(list, 'li');
    buildCard(list, 'li');

    const { cards } = detectCards();
    expect(cards[0]).toHaveProperty('hasAction');
    expect(cards[0].hasAction).toBe(true);
  });

  test('does not detect a single container as a card group', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    buildCard(wrapper);

    const { cards } = detectCards();
    expect(cards).toHaveLength(0);
  });

  test('detects article siblings as card group', () => {
    const section = document.createElement('section');
    document.body.appendChild(section);
    buildCard(section, 'article');
    buildCard(section, 'article');
    buildCard(section, 'article');

    const { cards } = detectCards();
    expect(cards.some(c => c.tag === 'article')).toBe(true);
  });

  test('detects card group with div siblings', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    buildCard(wrapper, 'div');
    buildCard(wrapper, 'div');

    const { cards } = detectCards();
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { cards } = detectCards();
    expect(cards).toHaveLength(0);
  });

  test('container with no image child does not contribute to card group', () => {
    const list = document.createElement('ul');
    document.body.appendChild(list);

    // Two siblings with no img — not card-like
    for (let i = 0; i < 2; i++) {
      const li = document.createElement('li');
      li.__fakeStyle__ = fakeStyle();
      const p = document.createElement('p');
      p.__fakeStyle__ = fakeStyle();
      li.appendChild(p);
      list.appendChild(li);
    }

    const { cards } = detectCards();
    expect(cards).toHaveLength(0);
  });
});
