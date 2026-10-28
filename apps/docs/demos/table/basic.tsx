import { useState } from 'react'

import {
  Badge,
  Input,
  Label,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fish-admin/react'

import { MEMBERS } from '../data/members'

const TEAM_LABELS = {
  engineering: 'Engineering',
  design: 'Design',
  product: 'Product',
}

export default function TableBasic() {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const rows = MEMBERS.filter(
    (member) => member.name.toLowerCase().includes(normalized) || member.team.includes(normalized),
  )

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '36rem' }}>
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <Label htmlFor="demo-table-search">Filter members</Label>
        <Input
          id="demo-table-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or team"
        />
      </div>
      <Table>
        <TableCaption>Workspace members and the teams they belong to.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell className="fish-demo-muted">{TEAM_LABELS[member.team]}</TableCell>
              <TableCell>
                <Badge variant={member.status === 'active' ? 'secondary' : 'outline'}>
                  {member.status === 'active' ? 'Active' : 'Invited'}
                </Badge>
              </TableCell>
              <TableCell className="fish-demo-muted">{member.joined}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                style={{ color: 'var(--muted-foreground)', whiteSpace: 'normal' }}
              >
                {`No members match "${query.trim()}".`}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}
