import { useState } from 'react';
import { useBoard } from '@/hooks/useBoard';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createConfig } from '@/lib/api';
import { toast } from 'sonner';

export default function BoardSwitcher() {
  const { boards, activeBoardId, setActiveBoardId, refreshBoards, loading } = useBoard();
  const [open, setOpen] = useState(false);
  const [showNewBoardDialog, setShowNewBoardDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await createConfig('boards', { name: newBoardName });
      await refreshBoards();
      setActiveBoardId(res.id);
      setNewBoardName('');
      setShowNewBoardDialog(false);
      toast.success('Workspace created');
    } catch (err) {
      toast.error(err.message || 'Failed to create workspace');
    }
  };

  if (loading && !activeBoard) return <div className="w-[200px] h-9 bg-muted animate-pulse rounded-md" />;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {activeBoard ? activeBoard.name : 'Select workspace...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search workspaces..." />
            <CommandList>
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup heading="Your Workspaces">
                {boards.map((board) => (
                  <CommandItem
                    key={board.id}
                    onSelect={() => {
                      setActiveBoardId(board.id);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        activeBoardId === board.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {board.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowNewBoardDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Workspace
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewBoardDialog} onOpenChange={setShowNewBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Create a new isolated board for distinct projects or life categories.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBoard}>
            <div className="py-4">
              <Input
                placeholder="e.g. Personal Life, Side Hustle..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowNewBoardDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newBoardName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
