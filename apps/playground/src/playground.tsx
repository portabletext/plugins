import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  type RenderDecoratorFunction,
  type RenderPlaceholderFunction,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {CharacterPairDecoratorPlugin} from '@portabletext/plugin-character-pair-decorator'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {createStore} from '@xstate/store'
import {useSelector} from '@xstate/store/react'

const featureFlags = createStore({
  context: {
    enableCharacterPairDecoratorPlugin: false,
    enableOneLinePlugin: false,
  },
  on: {
    toggleCharacterPairDecoratorPlugin: (context) => ({
      ...context,
      enableCharacterPairDecoratorPlugin:
        !context.enableCharacterPairDecoratorPlugin,
    }),
    toggleOneLinePlugin: (context) => ({
      ...context,
      enableOneLinePlugin: !context.enableOneLinePlugin,
    }),
  },
})

export function Playground() {
  const enableCharacterPairDecoratorPlugin = useSelector(
    featureFlags,
    (s) => s.context.enableCharacterPairDecoratorPlugin,
  )
  const enableOneLinePlugin = useSelector(
    featureFlags,
    (s) => s.context.enableOneLinePlugin,
  )

  return (
    <>
      <div>
        <EditorProvider
          initialConfig={{
            schemaDefinition: defineSchema({
              decorators: [{name: 'em'}],
            }),
          }}
        >
          <PortableTextEditable
            style={{
              border: '1px solid black',
            }}
            renderDecorator={renderDecorator}
            renderPlaceholder={renderPlaceholder}
          />
          <EventListenerPlugin on={console.info} />
          {enableCharacterPairDecoratorPlugin ? (
            <CharacterPairDecoratorPlugin
              decorator={({schema}) =>
                schema.decorators.find((d) => d.name === 'em')?.name
              }
              pair={{char: '#', amount: 1}}
            />
          ) : null}
          {enableOneLinePlugin ? <OneLinePlugin /> : null}
        </EditorProvider>
      </div>
      <div>
        Plugins:
        <ol>
          <li>
            <label>
              <input
                type="checkbox"
                checked={enableCharacterPairDecoratorPlugin}
                onChange={() => {
                  featureFlags.trigger.toggleCharacterPairDecoratorPlugin()
                }}
              />
              Character Pair Decorator Plugin (turn <code>#foo#</code> into{' '}
              <code>
                <em>foo</em>
              </code>
              )
            </label>
          </li>
          <li>
            <label>
              <input
                type="checkbox"
                checked={enableOneLinePlugin}
                onChange={() => {
                  featureFlags.trigger.toggleOneLinePlugin()
                }}
              />
              One-Line Plugin
            </label>
          </li>
        </ol>
      </div>
    </>
  )
}

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === 'em') {
    return <em>{props.children}</em>
  }
  return props.children
}

const renderPlaceholder: RenderPlaceholderFunction = () => {
  return <span>Type something</span>
}
