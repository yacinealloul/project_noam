'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Loader2, Zap, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type CardPokemonItem = {
  id: number
  name: string
  listingPrice: number
  currentPrice: number
}

export default function Home() {
  const [data, setData] = useState<CardPokemonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<keyof CardPokemonItem>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [mostExpensiveCard, setMostExpensiveCard] = useState<CardPokemonItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const eventSource = new EventSource('http://127.0.0.1:5000/stream-data')

    eventSource.onmessage = (e) => {
      try {
        const parsedData = JSON.parse(e.data)
        setData((prev) => {
          const newData = [...prev, parsedData]
          updateMostExpensiveCard(newData)
          return newData
        })
      } catch (err) {
        console.error('Error parsing data:', err)
      }
    }

    eventSource.onopen = () => {
      setLoading(false)
    }

    eventSource.onerror = (ev) => {
      console.log(ev)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const updateMostExpensiveCard = (cards: CardPokemonItem[]) => {
    const mostExpensive = cards.reduce((max, card) =>
      card.currentPrice > max.currentPrice ? card : max
      , cards[0])
    setMostExpensiveCard(mostExpensive)
  }

  const handleSort = (column: keyof CardPokemonItem) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1
    if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const paginatedData = sortedData.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  )

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const averagePriceDifference = data.length > 0
    ? data.reduce((sum, item) => sum + (item.currentPrice - item.listingPrice), 0) / data.length
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 text-white">
      <div className="container mx-auto p-4">
        <header className="mb-12 text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Pokemex</h1>
          <p className="text-2xl text-green-300">Card Pokemon Market Data</p>
        </header>

        {mostExpensiveCard && (
          <Card className="mb-12 bg-green-800/50 text-white border-green-400 shadow-lg shadow-green-400/20">
            <CardHeader>
              <CardTitle className="text-3xl text-green-300 flex items-center">
                <Star className="h-8 w-8 mr-2 text-yellow-400" />
                Most Expensive Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-4xl font-bold mb-2">{mostExpensiveCard.name}</p>
                  <p className="text-2xl">Current Price: <span className="text-green-300">${mostExpensiveCard.currentPrice.toFixed(2)}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-12 bg-black/50 text-white border-green-500 shadow-lg shadow-green-500/20">
          <CardHeader>
            <CardTitle className="text-3xl text-green-400">Market Overview</CardTitle>
            <CardDescription className="text-xl text-gray-400">Real-time updates of Card Pokemon prices</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-green-400" />
                <span className="ml-4 text-xl">Connecting to data stream...</span>
              </div>
            )}
            {error && <p className="text-red-500 text-xl">{error}</p>}
            {!loading && data.length === 0 && !error && <p className="text-xl">No data received yet.</p>}
            {!loading && data.length > 0 && (
              <>
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-green-900/50 border-green-400 shadow-inner shadow-green-400/20">
                    <CardHeader>
                      <CardTitle className="text-2xl text-green-300">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{data.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-900/50 border-green-400 shadow-inner shadow-green-400/20">
                    <CardHeader>
                      <CardTitle className="text-2xl text-green-300">Average Price Difference</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">${averagePriceDifference.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-900/50 border-green-400 shadow-inner shadow-green-400/20">
                    <CardHeader>
                      <CardTitle className="text-2xl text-green-300">Highest Price Difference</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">
                        ${Math.max(0, ...data.map(item => item.currentPrice - item.listingPrice)).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="rounded-lg border border-green-500 overflow-hidden shadow-lg shadow-green-500/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-900/50 hover:bg-green-800/50">
                        {(['id', 'name', 'listingPrice', 'currentPrice'] as const).map((column) => (
                          <TableHead key={column} className="text-green-300 text-lg">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort(column)}
                              className="text-green-300 hover:text-white text-lg"
                            >
                              {column.charAt(0).toUpperCase() + column.slice(1)}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                        ))}
                        <TableHead className="text-green-300 text-lg">Price Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length <= 5 && paginatedData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-green-800/30">
                          <TableCell className="text-lg">{item.id}</TableCell>
                          <TableCell className="text-lg">{item.name}</TableCell>
                          <TableCell className="text-lg">${item.listingPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-lg">${item.currentPrice.toFixed(2)}</TableCell>
                          <TableCell className={cn(
                            item.currentPrice - item.listingPrice > 0 ? 'text-green-400' : 'text-red-400',
                            "font-medium text-lg"
                          )}>
                            ${(item.currentPrice - item.listingPrice).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination className="mt-6">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => prev - 1)}
                        />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink isActive>{currentPage}</PaginationLink>
                    </PaginationItem>
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => prev + 1)}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}