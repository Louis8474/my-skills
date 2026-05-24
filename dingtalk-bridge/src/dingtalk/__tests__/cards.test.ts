import { CardBuilder, CardCallbackHandler } from '../cards';
import type { CardCallbackData } from '../cards';

describe('CardBuilder', () => {
  test('creates markdown card without buttons', () => {
    const card = CardBuilder.createMarkdownCard({
      title: 'Test Title',
      content: 'Test content',
    });

    expect(card.msgtype).toBe('markdown');
    expect((card.markdown as Record<string, string>).title).toBe('Test Title');
    expect((card.markdown as Record<string, string>).text).toBe('Test content');
  });

  test('creates action card with single button', () => {
    const card = CardBuilder.createMarkdownCard({
      title: 'Confirm',
      content: 'Are you sure?',
      buttons: [{ text: 'Yes', value: 'yes', type: 'primary' }],
    });

    expect(card.msgtype).toBe('actionCard');
    const actionCard = card.actionCard as Record<string, unknown>;
    expect(actionCard.singleTitle).toBe('Yes');
    expect(actionCard.singleURL).toBe('action://yes');
  });

  test('creates action card with multiple buttons', () => {
    const card = CardBuilder.createMarkdownCard({
      title: 'Choose',
      content: 'Pick one',
      buttons: [
        { text: 'Option A', value: 'a' },
        { text: 'Option B', value: 'b' },
      ],
    });

    expect(card.msgtype).toBe('actionCard');
    const actionCard = card.actionCard as Record<string, unknown>;
    const btns = actionCard.btns as Array<Record<string, string>>;
    expect(btns).toHaveLength(2);
    expect(btns[0].title).toBe('Option A');
    expect(btns[1].actionURL).toBe('action://b');
  });

  test('creates action card with image', () => {
    const card = CardBuilder.createMarkdownCard({
      title: 'Image Card',
      content: 'Description',
      imageUrl: 'https://example.com/img.png',
    });

    const text = (card.markdown as Record<string, string>).text;
    expect(text).toContain('https://example.com/img.png');
    expect(text).toContain('Description');
  });

  test('createActionCard convenience method', () => {
    const card = CardBuilder.createActionCard('Title', 'Content', [
      { text: 'Go', value: 'go' },
    ]);

    expect(card.msgtype).toBe('actionCard');
  });

  test('createConfirmCard creates confirm/cancel buttons', () => {
    const card = CardBuilder.createConfirmCard('Confirm', 'Sure?', 'OK', 'No');
    const actionCard = card.actionCard as Record<string, unknown>;
    const btns = actionCard.btns as Array<Record<string, string>>;
    expect(btns).toHaveLength(2);
    expect(btns[0].actionURL).toBe('action://confirm');
    expect(btns[1].actionURL).toBe('action://cancel');
  });
});

describe('CardCallbackHandler', () => {
  let handler: CardCallbackHandler;

  beforeEach(() => {
    handler = new CardCallbackHandler();
  });

  test('registers and calls handler', async () => {
    const results: string[] = [];
    handler.registerHandler('confirm', async (data) => {
      results.push(data.action);
    });

    await handler.handleCallback({
      conversationId: 'conv-1',
      userId: 'user-1',
      action: 'confirm',
      cardId: 'card-1',
    });

    expect(results).toEqual(['confirm']);
  });

  test('calls default handler when no specific handler', async () => {
    const results: string[] = [];
    handler.setDefaultHandler(async (data) => {
      results.push(`default:${data.action}`);
    });

    await handler.handleCallback({
      conversationId: 'conv-1',
      userId: 'user-1',
      action: 'unknown',
      cardId: 'card-1',
    });

    expect(results).toEqual(['default:unknown']);
  });

  test('does nothing when no handler matches', async () => {
    await handler.handleCallback({
      conversationId: 'conv-1',
      userId: 'user-1',
      action: 'unknown',
      cardId: 'card-1',
    });
  });

  test('removes handler', () => {
    handler.registerHandler('test', async () => {});
    handler.removeHandler('test');
    expect(handler.listHandlers()).not.toContain('test');
  });

  test('lists handlers', () => {
    handler.registerHandler('a', async () => {});
    handler.registerHandler('b', async () => {});
    expect(handler.listHandlers()).toEqual(['a', 'b']);
  });
});