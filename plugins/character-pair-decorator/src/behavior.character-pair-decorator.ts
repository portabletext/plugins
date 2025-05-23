import type {BlockOffset, EditorSchema} from '@portabletext/editor'
import {defineBehavior, effect, execute} from '@portabletext/editor/behaviors'
import * as selectors from '@portabletext/editor/selectors'
import * as utils from '@portabletext/editor/utils'
import {createCharacterPairRegex} from './regex.character-pair'

export function createCharacterPairDecoratorBehavior(config: {
  decorator: ({schema}: {schema: EditorSchema}) => string | undefined
  pair: {char: string; amount: number}
  onDecorate: (offset: BlockOffset) => void
}) {
  if (config.pair.amount < 1) {
    console.warn(
      `The amount of characters in the pair should be greater than 0`,
    )
  }

  const pairRegex = createCharacterPairRegex(
    config.pair.char,
    config.pair.amount,
  )
  const regEx = new RegExp(`(${pairRegex})$`)

  return defineBehavior({
    on: 'insert.text',
    guard: ({snapshot, event}) => {
      if (config.pair.amount < 1) {
        return false
      }

      const decorator = config.decorator({schema: snapshot.context.schema})

      if (decorator === undefined) {
        return false
      }

      const focusTextBlock = selectors.getFocusTextBlock(snapshot)
      const selectionStartPoint = selectors.getSelectionStartPoint(snapshot)
      const selectionStartOffset = selectionStartPoint
        ? utils.spanSelectionPointToBlockOffset({
            context: snapshot.context,
            selectionPoint: selectionStartPoint,
          })
        : undefined

      if (!focusTextBlock || !selectionStartOffset) {
        return false
      }

      const textBefore = selectors.getBlockTextBefore(snapshot)
      const newText = `${textBefore}${event.text}`
      const textToDecorate = newText.match(regEx)?.at(0)

      if (textToDecorate === undefined) {
        return false
      }

      const prefixOffsets = {
        anchor: {
          path: focusTextBlock.path,
          // Example: "foo **bar**".length - "**bar**".length = 4
          offset: newText.length - textToDecorate.length,
        },
        focus: {
          path: focusTextBlock.path,
          // Example: "foo **bar**".length - "**bar**".length + "*".length * 2 = 6
          offset:
            newText.length -
            textToDecorate.length +
            config.pair.char.length * config.pair.amount,
        },
      }

      const suffixOffsets = {
        anchor: {
          path: focusTextBlock.path,
          // Example: "foo **bar*|" (10) + "*".length - 2 = 9
          offset:
            selectionStartOffset.offset +
            event.text.length -
            config.pair.char.length * config.pair.amount,
        },
        focus: {
          path: focusTextBlock.path,
          // Example: "foo **bar*|" (10) + "*".length = 11
          offset: selectionStartOffset.offset + event.text.length,
        },
      }

      // If the prefix is more than one character, then we need to check if
      // there is an inline object inside it
      if (prefixOffsets.focus.offset - prefixOffsets.anchor.offset > 1) {
        const prefixSelection = utils.blockOffsetsToSelection({
          context: snapshot.context,
          offsets: prefixOffsets,
        })
        const inlineObjectBeforePrefixFocus = selectors.getPreviousInlineObject(
          {
            ...snapshot,
            context: {
              ...snapshot.context,
              selection: prefixSelection
                ? {
                    anchor: prefixSelection.focus,
                    focus: prefixSelection.focus,
                  }
                : null,
            },
          },
        )
        const inlineObjectBeforePrefixFocusOffset =
          inlineObjectBeforePrefixFocus
            ? utils.childSelectionPointToBlockOffset({
                context: snapshot.context,
                selectionPoint: {
                  path: inlineObjectBeforePrefixFocus.path,
                  offset: 0,
                },
              })
            : undefined

        if (
          inlineObjectBeforePrefixFocusOffset &&
          inlineObjectBeforePrefixFocusOffset.offset >
            prefixOffsets.anchor.offset &&
          inlineObjectBeforePrefixFocusOffset.offset <
            prefixOffsets.focus.offset
        ) {
          return false
        }
      }

      // If the suffix is more than one character, then we need to check if
      // there is an inline object inside it
      if (suffixOffsets.focus.offset - suffixOffsets.anchor.offset > 1) {
        const previousInlineObject = selectors.getPreviousInlineObject(snapshot)
        const previousInlineObjectOffset = previousInlineObject
          ? utils.childSelectionPointToBlockOffset({
              context: snapshot.context,
              selectionPoint: {
                path: previousInlineObject.path,
                offset: 0,
              },
            })
          : undefined

        if (
          previousInlineObjectOffset &&
          previousInlineObjectOffset.offset > suffixOffsets.anchor.offset &&
          previousInlineObjectOffset.offset < suffixOffsets.focus.offset
        ) {
          return false
        }
      }

      return {
        prefixOffsets,
        suffixOffsets,
        decorator,
      }
    },
    actions: [
      // Insert the text as usual in its own undo step
      ({event}) => [execute(event)],
      (_, {prefixOffsets, suffixOffsets, decorator}) => [
        // Decorate the text between the prefix and suffix
        execute({
          type: 'decorator.add',
          decorator,
          at: {
            anchor: prefixOffsets.focus,
            focus: suffixOffsets.anchor,
          },
        }),
        // Delete the suffix
        execute({
          type: 'delete.text',
          at: suffixOffsets,
        }),
        // Delete the prefix
        execute({
          type: 'delete.text',
          at: prefixOffsets,
        }),
        // Toggle the decorator off so the next inserted text isn't emphasized
        execute({
          type: 'decorator.remove',
          decorator,
        }),
        effect(() => {
          config.onDecorate({
            ...suffixOffsets.anchor,
            offset:
              suffixOffsets.anchor.offset -
              (prefixOffsets.focus.offset - prefixOffsets.anchor.offset),
          })
        }),
      ],
    ],
  })
}
