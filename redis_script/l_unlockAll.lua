-------------------------------------------------------------------------------
-- © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
-------------------------------------------------------------------------------

local userName = ARGV[1]
local branch = ARGV[2]

local userLocksKey = 'userLocks:' .. userName
local fileKeys = redis.call('HKEYS', userLocksKey)
for i = 1, #fileKeys do
  redis.call('DEL', fileKeys[i])
end

redis.call('DEL', userLocksKey)
