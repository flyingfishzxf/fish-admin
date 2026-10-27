import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'

import { TagsInput } from './tags-input'

function Harness({ maxTags }: { maxTags?: number }) {
  const [tags, setTags] = useState<string[]>(['owner'])

  return (
    <TagsInput
      value={tags}
      onChange={setTags}
      ariaLabel="Tags"
      placeholder="Add a tag"
      maxTags={maxTags}
    />
  )
}

describe('TagsInput', () => {
  beforeAll(async () => {})

  it('adds a tag with Enter and clears the draft', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Tags')

    fireEvent.change(input, { target: { value: 'remote' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('remote')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('splits comma-separated input into separate tags', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Tags')

    fireEvent.change(input, { target: { value: 'remote,on-call,contractor' } })

    expect(screen.getByText('remote')).toBeInTheDocument()
    expect(screen.getByText('on-call')).toBeInTheDocument()
    expect(screen.getByText('contractor')).toBeInTheDocument()
  })

  it('ignores duplicate and blank tags', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Tags')

    fireEvent.change(input, { target: { value: 'owner' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getAllByText('owner')).toHaveLength(1)
  })

  it('removes the last tag on Backspace when the draft is empty', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Tags')

    fireEvent.keyDown(input, { key: 'Backspace' })

    expect(screen.queryByText('owner')).not.toBeInTheDocument()
  })

  it('removes a tag through its button and enforces the limit', () => {
    render(<Harness maxTags={1} />)

    const input = screen.getByLabelText('Tags')
    expect(input).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Remove owner' }))
    expect(screen.queryByText('owner')).not.toBeInTheDocument()
    expect(input).toBeEnabled()
  })
})
