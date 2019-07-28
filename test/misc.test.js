import React, { Component } from "react"
import * as mobx from "mobx"
import { observer } from "../src"
import { withConsole } from "./index"
import renderer, { act } from "react-test-renderer"
import { render } from "@testing-library/react"

const mobxAdminProperty = mobx.$mobx || "$mobx"

test("issue mobx 405", () => {
    function ExampleState() {
        mobx.extendObservable(this, {
            name: "test",
            get greetings() {
                return "Hello my name is " + this.name
            }
        })
    }

    const ExampleView = observer(
        class T extends Component {
            render() {
                return (
                    <div>
                        <input
                            type="text"
                            onChange={e => (this.props.exampleState.name = e.target.value)}
                            value={this.props.exampleState.name}
                        />
                        <span>{this.props.exampleState.greetings}</span>
                    </div>
                )
            }
        }
    )

    const exampleState = new ExampleState()
    const wrapper = renderer.create(<ExampleView exampleState={exampleState} />)
    expect(wrapper.toJSON()).toMatchInlineSnapshot(`
<div>
  <input
    onChange={[Function]}
    type="text"
    value="test"
  />
  <span>
    Hello my name is test
  </span>
</div>
`)
})

test("#85 Should handle state changing in constructors", () => {
    const a = mobx.observable.box(2)
    const Child = observer(
        class Child extends Component {
            constructor(p) {
                super(p)
                a.set(3) // one shouldn't do this!
                this.state = {}
            }
            render() {
                return (
                    <div>
                        child:
                        {a.get()} -{" "}
                    </div>
                )
            }
        }
    )
    const ParentWrapper = observer(function Parent() {
        return (
            <span>
                <Child />
                parent:
                {a.get()}
            </span>
        )
    })
    const { container } = render(<ParentWrapper />)
    expect(container).toHaveTextContent("child:3 - parent:3")

    a.set(5)
    expect(container).toHaveTextContent("child:5 - parent:5")

    a.set(7)
    expect(container).toHaveTextContent("child:7 - parent:7")
})

test("testIsComponentReactive", () => {
    const C = observer(() => null)
    const wrapper = renderer.create(<C />)
    const instance = wrapper.getInstance()

    // instance is something different then the rendering reaction!
    expect(mobx.isObservable(instance)).toBeFalsy()
})

test("Do not warn about custom shouldComponentUpdate when it is the one provided by ReactiveMixin", () => {
    expect(
        withConsole(() => {
            const A = observer(
                class A extends React.Component {
                    render() {
                        return null
                    }
                }
            )

            observer(
                class B extends A {
                    render() {
                        return null
                    }
                }
            )
        })
    ).toMatchSnapshot()
})
